// public/login.js

document.addEventListener("DOMContentLoaded", () => {
  // Obtener elementos del DOM de la página de login (FacmApp.html)
 
  const form = document.getElementById("form-login");
  const usuarioInput = document.getElementById("user");
  const claveInput = document.getElementById("pass");
  const mensajeError = document.getElementById("mensaje-error");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); 

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
            "Content-Type": "application/json", 
          },
          body: JSON.stringify({ usuario, contrasena }), 
          credentials: "include", 
        });

        const data = await response.json(); 

        if (response.ok) {
        
          window.location.href = "/index.html"; 
        } else {
          
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
    
    console.error("Error: No se encontró el formulario con el ID 'form-login'.");
  }
});
