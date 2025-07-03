// server.js

// Cargar las variables de entorno al inicio del archivo del servidor
require("dotenv").config(); 

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const nodemailer = require("nodemailer"); // Importación CORRECTA de nodemailer
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// =========================================================
// Depuración inicial de variables de entorno (temporal)
// =========================================================
console.log('--- Depuración de Variables de Entorno al inicio ---');
console.log('SESSION_SECRET length:', process.env.SESSION_SECRET ? process.env.SESSION_SECRET.length : 'UNDEFINED');
console.log('LOGIN_USER:', process.env.LOGIN_USER);
console.log('LOGIN_PASS_HASH length:', process.env.LOGIN_PASS_HASH ? process.env.LOGIN_PASS_HASH.length : 'UNDEFINED');
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS length:', process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 'UNDEFINED');
console.log('--- Fin Depuración de Variables de Entorno ---');
// =========================================================

// Sesión
app.use(session({
    secret: process.env.SESSION_SECRET || "faccma_secret_key_default", // Usa un default si no está definida (solo para desarrollo/tests)
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true en producción con HTTPS, false en desarrollo
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000 // 2 horas
    }
}));

// Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // =========================================================
    // Depuración de Login (temporal)
    // =========================================================
    console.log('--- Intento de Login ---');
    console.log('Usuario recibido (del formulario):', username);
    console.log('Usuario esperado (desde .env):', process.env.LOGIN_USER);
    console.log('Hash almacenado (desde .env):', process.env.LOGIN_PASS_HASH);
    // =========================================================

    // Primero, verifica si el usuario coincide
    if (username !== process.env.LOGIN_USER) {
        console.warn('Login Fallido: Usuario no coincide.');
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    // Luego, verifica la contraseña con bcrypt
    try {
        const esValido = await bcrypt.compare(password, process.env.LOGIN_PASS_HASH);
        
        console.log('Resultado de bcrypt.compare():', esValido); // Clave para depurar el hash

        if (esValido) {
            req.session.user = username;
            console.log('Login Exitoso.');
            return res.status(200).json({ message: "Login exitoso" });
        } else {
            console.warn('Login Fallido: Contraseña no coincide con el hash.');
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }
    } catch (error) {
        console.error('Error en bcrypt.compare() al autenticar:', error);
        return res.status(500).json({ message: "Error interno del servidor al autenticar." });
    }
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.status(500).send("Error al cerrar sesión");
        }
        res.clearCookie("connect.sid");
        res.redirect("/FacmApp.html");
    });
});

// Middleware protección de rutas privadas
function verificarSesion(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        console.warn("Intento de acceso a ruta protegida sin sesión activa.");
        return res.status(401).json({ message: "Sesión expirada o no iniciada" });
    }
}

// Multer
const upload = multer({ storage: multer.memoryStorage() });

// Envío de recibos
app.post("/enviar-recibos", verificarSesion, upload.array("recibos"), async (req, res) => {
    try {
        // Asegúrate de que req.body.datos es un string JSON válido
        const datos = JSON.parse(req.body.datos || "[]");
        const archivos = req.files || [];

        if (datos.length !== archivos.length) {
            console.warn("Cantidad de archivos y mails no coinciden:", { datos: datos.length, archivos: archivos.length });
            return res.status(400).json({ message: "Cantidad de archivos y mails no coinciden" });
        }

        // =========================================================
        // Configuración del transportador de Nodemailer
        // =========================================================
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // false para STARTTLS en puerto 587
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // Puede ser necesario para algunos entornos, aunque para Gmail no suele serlo
            },
            debug: true, // Habilita la depuración de Nodemailer
            logger: true // Habilita los logs de Nodemailer en consola
        });
        // =========================================================

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
        console.error("❌ ERROR en /enviar-recibos:", error);
        // Devuelve un error 500 al cliente con un mensaje más descriptivo si es posible
        return res.status(500).json({ 
            message: "Error interno del servidor", 
            error: error.message || error.toString() // Incluye el mensaje de error para depuración
        });
    }
});

// Fallback para rutas no encontradas
app.use((req, res) => {
    // Para cualquier ruta no definida, sirve la página principal
    res.status(404).sendFile(path.join(__dirname, "public", "FacmApp.html"));
});

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    // Asegúrate de que NODE_ENV esté configurado en Render a 'production' para el cookie secure
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});