// server.js

const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // Cargar variables de entorno al inicio

const app = express();
const PORT = 3000;

// Middleware general
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: "faccmaSuperClave123", // Una cadena secreta para firmar la cookie de sesión
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    httpOnly: true,
    secure: false, 
  },
}));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "public")));

// --- Middleware de autenticación (MODIFICADO para manejar peticiones fetch) ---
function protegerRuta(req, res, next) {
  
  const isXhr = req.xhr || req.headers.accept.includes('json') || req.headers['x-requested-with'] === 'XMLHttpRequest';

  if (req.session.usuario) {
    next(); 
  } else {
  
    if (isXhr) {
      
      return res.status(401).json({ message: "No autorizado. Por favor, inicia sesión de nuevo." });
    } else {
      
      res.redirect("/FacmApp.html");
    }
  }
}

// -------------------- RUTAS DE AUTENTICACIÓN Y REDIRECCIÓN (MODIFICADAS) --------------------

// Ruta raíz: redirige al login si no hay sesión, a la app si sí hay
app.get("/", (req, res) => {
  if (req.session.usuario) {
    res.redirect("/index.html"); 
  } else {
    res.redirect("/FacmApp.html"); 
  }
});

// Ruta protegida principal (requiere sesión)
app.get("/index.html", protegerRuta, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).send("Error al cerrar sesión.");
    }
    res.redirect("/FacmApp.html"); // Redirige al login después de cerrar sesión
  });
});


const LOGIN_USER = process.env.LOGIN_USER;
const LOGIN_PASS_HASH = process.env.LOGIN_PASS_HASH;


if (!LOGIN_USER || !LOGIN_PASS_HASH) {
    console.warn("Advertencia: Las variables de entorno LOGIN_USER o LOGIN_PASS_HASH no están configuradas en .env.");
    console.warn("Asegúrate de haber generado el hash para la contraseña y añadido LOGIN_USER y LOGIN_PASS_HASH a tu archivo .env");

}

// Ruta POST para el inicio de sesión
app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  
  if (usuario === LOGIN_USER) {
   
    const passwordMatch = await bcrypt.compare(contrasena, LOGIN_PASS_HASH);

    if (passwordMatch) {
      req.session.usuario = usuario; // Guarda el usuario en la sesión
      res.json({ ok: true, message: "Inicio de sesión exitoso" });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  } else {
    res.status(401).json({ error: "Credenciales inválidas" });
  }
});

// -------------------- MULTER (Configuración para subir archivos) --------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// -------------------- NODEMAILER (Configuración para enviar correos) --------------------

// Obtenemos las credenciales de Gmail desde las variables de entorno
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS; // Clave de aplicación de Gmail

// Advertencia si las credenciales de correo no están configuradas
if (!MAIL_USER || !MAIL_PASS) {
    console.warn("Advertencia: Las variables de entorno MAIL_USER o MAIL_PASS no están configuradas para Nodemailer.");
    console.warn("Asegúrate de haber añadido MAIL_USER y MAIL_PASS (clave de aplicación de Gmail) a tu archivo .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail", // Usar el servicio 'gmail' facilita la configuración
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
  // No necesitamos host, port, secure, tls con 'service: "gmail"' a menos que haya un caso muy específico
});


// -------------------- RUTA PARA ENVIAR RECIBOS --------------------

app.post("/enviar-recibos", protegerRuta, upload.array("recibos"), async (req, res) => {
  try {
    const datos = JSON.parse(req.body.datos);

    for (let i = 0; i < datos.length; i++) {
      const mailOptions = {
        from: MAIL_USER,
        to: datos[i].email,
        subject: "Recibo de sueldo - FACCMA",
        text: "Adjunto encontrarás tu recibo correspondiente.",
        attachments: [
          {
            filename: req.files[i].originalname,
            path: req.files[i].path,
          },
        ],
      };
      await transporter.sendMail(mailOptions);
    }

    req.files.forEach((file) => {
      fs.unlinkSync(file.path);
    });

    res.json({ message: "Todos los recibos fueron enviados correctamente." });
  } catch (error) {
    console.error("Error al enviar correos:", error);
    res.status(500).json({ message: "Error al enviar correos." });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});