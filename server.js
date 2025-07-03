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

// Middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesión
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000
  }
}));

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.LOGIN_USER) {
    const esValido = await bcrypt.compare(password, process.env.LOGIN_PASS_HASH);
    if (esValido) {
      req.session.user = username;
      return res.status(200).json({ message: "Login exitoso" });
    }
  }
  return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Error al cerrar sesión");
    res.clearCookie("connect.sid");
    res.redirect("/FacmApp.html");
  });
});

// Middleware protección
function verificarSesion(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ message: "Sesión no iniciada" });
}

// Multer
const upload = multer({ storage: multer.memoryStorage() });

// Envío de recibos
app.post("/enviar-recibos", verificarSesion, upload.array("recibos"), async (req, res) => {
  try {
    const datos = JSON.parse(req.body.datos || "[]");
    const archivos = req.files || [];

    if (datos.length !== archivos.length) {
      return res.status(400).json({ message: "Cantidad de archivos y mails no coinciden" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
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
      console.log("✉️ Enviado a:", datos[i].email);
    }

    return res.status(200).json({ message: "Todos los correos fueron enviados correctamente" });

  } catch (error) {
    console.error("❌ Error al enviar correos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "FacmApp.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
