// server.js

// Cargar las variables de entorno al inicio del archivo del servidor
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

// =========================================================
// MIDDLEWARES - ¡ORDEN IMPORTANTE!
// =========================================================

// CORS (si lo necesitas, antes de las rutas)
app.use(cors()); 

// Parseo del cuerpo de las solicitudes (antes de la sesión)
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// =========================================================
// Depuración inicial de variables de entorno (temporal)
// =========================================================
console.log('--- Depuración de Variables de Entorno al inicio ---');
console.log('NODE_ENV:', process.env.NODE_ENV); // <-- Verifica si es 'production'
console.log('SESSION_SECRET length:', process.env.SESSION_SECRET ? process.env.SESSION_SECRET.length : 'UNDEFINED');
console.log('LOGIN_USER:', process.env.LOGIN_USER);
console.log('LOGIN_PASS_HASH length:', process.env.LOGIN_PASS_HASH ? process.env.LOGIN_PASS_HASH.length : 'UNDEFINED');
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS length:', process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 'UNDEFINED');
console.log('--- Fin Depuración de Variables de Entorno ---');
// =========================================================

// Sesión (¡DEBE IR ANTES DE CUALQUIER RUTA O MIDDLEWARE QUE REQUIERA req.session!)
app.use(session({
    secret: process.env.SESSION_SECRET || "faccma_secret_key_default_fallback", // Usa un default si no está definida (solo para desarrollo/tests, en prod usar variable real)
    resave: false, // No guardar sesión si no fue modificada
    saveUninitialized: false, // No guardar sesiones no inicializadas (sin datos)
    cookie: {
        secure: process.env.NODE_ENV === 'production', // ¡TRUE en producción con HTTPS, FALSE en desarrollo local sin HTTPS!
        httpOnly: true, // La cookie solo es accesible por el servidor, no por JavaScript del cliente
        maxAge: 2 * 60 * 60 * 1000 // 2 horas (en milisegundos)
        // domain: '.facmapp.onrender.com' // <-- Considera esto SOLO si los problemas persisten con subdominios
    }
}));

// Sirviendo archivos estáticos (Puede ir aquí o antes, pero después de la sesión es más seguro para deps.)
app.use(express.static(path.join(__dirname, "public")));

// =========================================================
// RUTAS
// =========================================================

// Ruta de Login
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
            req.session.user = username; // Almacena el usuario en la sesión
            console.log('Login Exitoso.');
            console.log('Sesión creada para usuario:', req.session.user); // <-- Muestra el usuario en sesión
            console.log('ID de sesión (después de login):', req.session.id); // <-- Muestra el ID de sesión
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

// Ruta de Logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.status(500).send("Error al cerrar sesión");
        }
        res.clearCookie("connect.sid"); // Limpia la cookie del navegador
        res.redirect("/FacmApp.html"); // Redirige al login o página principal
    });
});

// Middleware de protección para rutas privadas
function verificarSesion(req, res, next) {
    // =========================================================
    // Depuración de Sesión en rutas protegidas (temporal)
    // =========================================================
    console.log('--- Verificando Sesión en ruta protegida ---');
    console.log('req.session:', req.session); // <-- Verifica si req.session existe
    console.log('req.session.user:', req.session ? req.session.user : 'undefined'); // <-- Verifica si el usuario está en sesión
    // =========================================================

    if (req.session && req.session.user) {
        console.log('Sesión activa para usuario:', req.session.user);
        return next(); // Permite continuar a la ruta
    } else {
        console.warn("Intento de acceso a ruta protegida sin sesión activa.")}};