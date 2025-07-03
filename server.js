// server.js
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || "faccma_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000 // 2 horas
  }
}));

// Middleware para proteger rutas privadas
function verificarSesion(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ message: "Sesión expirada o no iniciada" });
  }
}

// ✅ Ruta login con async
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.LOGIN_USER) {
    try {
      const esValido = await bcrypt.compare(password, process.env.LOGIN_PASS_HASH);
      if (esValido) {
        req.session.user = username;
        return res.status(200).json({ message: "Login correcto" });
      }
    } catch (error) {
      console.error("Error al comparar contraseñas:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
});

// Ruta logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).send("Error al cerrar sesión");
    }
    res.clearCookie("connect.sid");
    return res.redirect("/FacmApp.html");
  });
});

// Multer para recibos PDF
const upload = multer({ storage: multer.memoryStorage() });

// Ruta de envío de recibos
app.post("/enviar-recibos", verificarSesion, upload.array("recibos"), async (req, res) => {
  try {
    const datos = JSON.parse(req.body.datos || "[]");
    const archivos = req.files || [];

    if (datos.length !== archivos.length) {
      return res.status(400).json({ message: "Cantidad de archivos y mails no coinciden" });
    }

    const transporter = nodemailer.createTransport({
      host: "mail.faccma.org",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    for (let i = 0; i < datos.length; i++) {
      await transporter.sendMail({
        from: `"FACCMApp" <${process.env.MAIL_USER}>`,
        to: datos[i].email,
        subject: "Recibo de sueldo FACCMApp",
        text: "Adjunto encontrarás tu recibo.",
        attachments: [{
          filename: archivos[i].originalname,
          content: archivos[i].buffer
        }]
      });
      console.log(`✉️ Correo enviado a: ${datos[i].email}`);
    }

    return res.status(200).json({ message: "Todos los correos fueron enviados correctamente" });
  } catch (error) {
    console.error("❌ Error al enviar recibos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Fallback 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "FacmApp.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
