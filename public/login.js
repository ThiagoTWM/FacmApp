// public/login.js

document.addEventListener("DOMContentLoaded", () => {
  // Obtener elementos del DOM de la página de login (FacmApp.html)
  // Los IDs deben coincidir con los de FacmApp.html
  const form = document.getElementById("form-login");
  const usuarioInput = document.getElementById("user");
  const claveInput = document.getElementById("pass");
  const mensajeError = document.getElementById("mensaje-error");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // Previene el envío tradicional del formulario

      const usuario = usuarioInput.value.trim();
      const contrasena = claveInput.value;

      if (!usuario || !contrasena) {
        if (mensajeError) {
          mensajeError.textContent = "Por favor, ingresa usuario y contraseña.";
          mensajeError.style.display = "block";
        }
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Indica que estamos enviando JSON
          },
          body: JSON.stringify({ usuario, contrasena }), // Convierte los datos a JSON
          credentials: "include", // ¡ESENCIAL! Envía cookies con la solicitud cross-origin
        });

        const data = await response.json(); // Parsea la respuesta JSON del servidor

        if (response.ok) {
          // Si la respuesta es OK (status 200-299), el login fue exitoso
          window.location.href = "/index.html"; // Redirige a la aplicación de PDFs (index.html)
        } else {
          // Si la respuesta no es OK, muestra el mensaje de error del servidor
          if (mensajeError) {
            mensajeError.textContent = data.error || "Error en el inicio de sesión.";
            mensajeError.style.display = "block";
          }
        }
      } catch (error) {
        console.error("Error de red:", error);
        if (mensajeError) {
          mensajeError.textContent = "Error de conexión. Intenta de nuevo más tarde.";
          mensajeError.style.display = "block";
        }
      }
    });
  } else {
    // Mensaje de error en consola si el formulario no se encuentra (para depuración)
    console.error("Error: No se encontró el formulario con el ID 'form-login'.");
  }
});