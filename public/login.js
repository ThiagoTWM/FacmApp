// public/login.js


const API_BASE_URL = "https://facmapp.onrender.com"; 
// --- FIN CONFIGURACIÓN IMPORTANTE ---


document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const mensajeError = document.getElementById("mensaje-error");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const usuario = form.usuario.value;
            const contrasena = form.contrasena.value;

            // Ocultar mensaje de error anterior
            mensajeError.style.display = "none";
            mensajeError.textContent = "";

            try {
                const response = await fetch(`${API_BASE_URL}/login`, { // Usa la URL base de la API
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ usuario, contrasena }),
                });

                if (response.ok) {
                    // Redirige a la página principal de la aplicación (index.html)
                    window.location.href = "/index.html"; // Redirección correcta
                } else {
                    const data = await response.json();
                    mensajeError.textContent = data.error || "Error en el inicio de sesión.";
                    mensajeError.style.display = "block";
                }
            } catch (error) {
                console.error("Error de red:", error);
                mensajeError.textContent = "Error de conexión al servidor. Intenta de nuevo más tarde.";
                mensajeError.style.display = "block";
            }
        });
    } else {
        console.error("Error: No se encontró el formulario con el ID 'login-form'.");
    }
});
