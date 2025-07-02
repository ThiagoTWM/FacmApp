// public/script.js

const API_BASE_URL = "https://facmapp.onrender.com"; 



document.addEventListener("DOMContentLoaded", () => {
  const btnAnadirRecibo = document.getElementById("anadir-recibo");
  const tablaRecibos = document.getElementById("tabla-recibos");
  const btnEnviarTodos = document.getElementById("enviar-todos");
  const mensajeError = document.getElementById("mensaje-error-envio"); 
  const btnCargarCsv = document.getElementById("cargarCsv"); /
  const fileInputCsv = document.getElementById("file-input-csv"); 

  let contadorRecibos = 0;

  // Ocultar el mensaje de error al inicio
  if (mensajeError) {
    mensajeError.style.display = "none";
  }

  // --- Manejo de mensajes de error de sesión ---
  // Función para mostrar un mensaje de error y redirigir
  function mostrarErrorYRedirigir(message) {
    if (mensajeError) {
      mensajeError.textContent = message;
      mensajeError.style.display = "block";
    }
    // Retraso para que el usuario pueda leer el mensaje antes de redirigir
    setTimeout(() => {
      window.location.href = "/FacmApp.html"; // Redirigir a la página de login
    }, 2000);
  }

  // --- Añadir Recibo ---
  if (btnAnadirRecibo) {
    btnAnadirRecibo.addEventListener("click", () => {
      contadorRecibos++;
      const nuevaFila = document.createElement("tr");
      nuevaFila.setAttribute("data-id", contadorRecibos);

      nuevaFila.innerHTML = `
                <td>${contadorRecibos}</td>
                <td>
                    <input type="file" class="input-pdf" accept=".pdf" required>
                    <span class="file-name"></span>
                </td>
                <td><input type="email" class="input-email" placeholder="ejemplo@dominio.com" required></td>
                <td><button type="button" class="btn-eliminar">X</button></td>
            `;
      tablaRecibos.querySelector("tbody").appendChild(nuevaFila);

      // Event listener para mostrar nombre de archivo
      nuevaFila.querySelector(".input-pdf").addEventListener("change", function () {
        const fileNameSpan = this.nextElementSibling;
        if (this.files.length > 0) {
          fileNameSpan.textContent = this.files[0].name;
        } else {
          fileNameSpan.textContent = "";
        }
      });

      // Event listener para eliminar fila
      nuevaFila.querySelector(".btn-eliminar").addEventListener("click", function () {
        this.closest("tr").remove();
        // Opcional: reordenar los números de fila después de eliminar
        actualizarNumeracionFilas();
      });
    });
  } else {
    console.warn("Advertencia: No se encontró el botón con el ID 'anadir-recibo'.");
  }

  // Función para actualizar la numeración de las filas
  function actualizarNumeracionFilas() {
    const filas = tablaRecibos.querySelectorAll("tbody tr");
    filas.forEach((fila, index) => {
      fila.querySelector("td:first-child").textContent = index + 1;
      fila.setAttribute("data-id", index + 1);
    });
    contadorRecibos = filas.length;
  }

  // --- Cargar CSV de Mails ---
  if (btnCargarCsv && fileInputCsv) {
    console.log("btnCargarCsv antes de addEventListener:", btnCargarCsv); // Para depuración
    btnCargarCsv.addEventListener("click", () => {
      fileInputCsv.click(); // Simula el click en el input de tipo file
    });

    fileInputCsv.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const csvText = e.target.result;
          procesarCsvMails(csvText);
        };
        reader.readAsText(file);
      }
    });
  } else {
    console.warn("Advertencia: No se encontró el botón 'cargarCsv' o el input 'file-input-csv'.", {btnCargarCsv, fileInputCsv});
  }


  function procesarCsvMails(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== ''); // Ignorar líneas vacías
    tablaRecibos.querySelector("tbody").innerHTML = ''; // Limpiar tabla existente
    contadorRecibos = 0; // Resetear contador

    lines.forEach(line => {
        const email = line.trim(); // Cada línea es un email
        if (email) {
            contadorRecibos++;
            const nuevaFila = document.createElement("tr");
            nuevaFila.setAttribute("data-id", contadorRecibos);

            nuevaFila.innerHTML = `
                <td>${contadorRecibos}</td>
                <td>
                    <input type="file" class="input-pdf" accept=".pdf" required>
                    <span class="file-name"></span>
                </td>
                <td><input type="email" class="input-email" value="${email}" required></td>
                <td><button type="button" class="btn-eliminar">X</button></td>
            `;
            tablaRecibos.querySelector("tbody").appendChild(nuevaFila);

            // Event listener para mostrar nombre de archivo
            nuevaFila.querySelector(".input-pdf").addEventListener("change", function () {
                const fileNameSpan = this.nextElementSibling;
                if (this.files.length > 0) {
                    fileNameSpan.textContent = this.files[0].name;
                } else {
                    fileNameSpan.textContent = "";
                }
            });

            // Event listener para eliminar fila
            nuevaFila.querySelector(".btn-eliminar").addEventListener("click", function () {
                this.closest("tr").remove();
                actualizarNumeracionFilas();
            });
        }
    });
  }


  // --- Enviar Todos ---
  if (btnEnviarTodos) {
    btnEnviarTodos.addEventListener("click", async () => {
      const filas = tablaRecibos.querySelectorAll("tbody tr");
      if (filas.length === 0) {
        alert("Por favor, añade al menos un recibo.");
        return;
      }

      const formData = new FormData();
      const datosParaEnviar = [];
      let hayErroresValidacion = false;

      // Ocultar mensaje de error antes de enviar
      if (mensajeError) {
        mensajeError.style.display = "none";
      }

      filas.forEach((fila, index) => {
        const inputPdf = fila.querySelector(".input-pdf");
        const inputEmail = fila.querySelector(".input-email");

        if (!inputPdf.files || inputPdf.files.length === 0) {
          alert(`La fila ${index + 1} no tiene un archivo PDF seleccionado.`);
          hayErroresValidacion = true;
          return;
        }
        if (!inputEmail.value || !inputEmail.checkValidity()) {
          alert(`La fila ${index + 1} tiene un correo electrónico inválido o vacío.`);
          hayErroresValidacion = true;
          return;
        }

        formData.append("recibos", inputPdf.files[0]);
        datosParaEnviar.push({ email: inputEmail.value });
      });

      if (hayErroresValidacion) {
        return;
      }

      formData.append("datos", JSON.stringify(datosParaEnviar));

      try {
        const response = await fetch(`${API_BASE_URL}/enviar-recibos`, { // Usa la URL base de la API
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          alert(data.message);
          // Limpiar la tabla después de un envío exitoso
          tablaRecibos.querySelector("tbody").innerHTML = '';
          contadorRecibos = 0;
        } else if (response.status === 401) {
          // Si la sesión expiró o no está autorizado
          const data = await response.json();
          mostrarErrorYRedirigir(data.message || "Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.");
        } else {
          // Otros errores del servidor
          const errorText = await response.text(); // Leer como texto para ver el error completo
          console.error("Error del servidor (HTTP):", response.status, errorText);
          if (mensajeError) {
            mensajeError.textContent = "Error al enviar correos. Revisa la consola para más detalles.";
            mensajeError.style.display = "block";
          }
        }
      } catch (error) {
        console.error("Error de conexión al servidor:", error);
        if (mensajeError) {
          mensajeError.textContent = "Error de conexión al servidor. Revisa tu conexión.";
          mensajeError.style.display = "block";
        }
      }
    });
  } else {
    console.warn("Advertencia: No se encontró el botón con el ID 'enviar-todos'.");
  }


  // --- Cerrar Sesión ---
  const btnCerrarSesion = document.getElementById("cerrar-sesion");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/logout`); // Usa la URL base de la API
        if (response.ok) {
          window.location.href = "/FacmApp.html"; // Redirige al login
        } else {
          console.error("Error al cerrar sesión:", await response.text());
          alert("No se pudo cerrar la sesión correctamente.");
        }
      } catch (error) {
        console.error("Error de red al intentar cerrar sesión:", error);
        alert("Error de conexión al cerrar sesión.");
      }
    });
  } else {
    console.warn("Advertencia: No se encontró el botón con el ID 'cerrar-sesion'.");
  }
});
