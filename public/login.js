document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const estado = document.getElementById("estado");

  if (!form) {
    console.error("No se encontró el formulario con el ID 'login-form'.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = new FormData(form);
    const usuario = datos.get("usuario");
    const contrasena = datos.get("contrasena");

    try {
      const response = await fetch("https://facmapp.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
        credentials: "include", // para que Render use la cookie de sesión
      });

      const data = await response.json();

      if (response.ok) {
        estado.textContent = "Ingreso exitoso. Redirigiendo...";
        estado.style.color = "green";
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 1000);
      } else {
        estado.textContent = data.error || "Credenciales inválidas.";
        estado.style.color = "red";
      }
    } catch (err) {
      console.error("Error al enviar la solicitud:", err);
      estado.textContent = "No se pudo conectar al servidor.";
      estado.style.color = "red";
    }
  });
});

