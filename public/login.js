// public/login.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("form");
  const inputUsuario = document.getElementById("usuario");
  const inputContrasena = document.getElementById("contrasena");
  const mensajeError = document.getElementById("mensaje-error");

  if (mensajeError) mensajeError.style.display = "none";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = inputUsuario.value.trim();
    const password = inputContrasena.value.trim();

    if (!username || !password) {
      mensajeError.textContent = "Por favor, completa todos los campos.";
      mensajeError.style.display = "block";
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        window.location.href = "/index.html";
      } else {
        const data = await response.json();
        mensajeError.textContent = data.message || "Credenciales incorrectas.";
        mensajeError.style.display = "block";
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      mensajeError.textContent = "Error de conexión con el servidor.";
      mensajeError.style.display = "block";
    }
  });
});

