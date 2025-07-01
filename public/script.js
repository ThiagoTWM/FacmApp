// public/script.js

document.addEventListener("DOMContentLoaded", () => {
    const tablaBody = document.getElementById("tabla-body");
    const btnAgregar = document.getElementById("agregar-fila");
    const btnEnviar = document.getElementById("enviar-todo");
    const estado = document.getElementById("estado");
    const loader = document.getElementById("loader");
    // ¡NUEVOS ELEMENTOS DEL DOM para CSV!
    const csvFileInput = document.getElementById("csvFileInput");
    const btnCargarCsv = document.getElementById("cargarCsv"); // Asegúrate de que este ID existe en tu index.html

    console.log("btnEnviar antes de addEventListener:", btnEnviar);
    console.log("btnCargarCsv antes de addEventListener:", btnCargarCsv);


    let contador = 1;

    // Listener para el botón "Añadir recibo"
    if (btnAgregar) { // Verificación extra por si el botón 'agregar-fila' no se encuentra
        btnAgregar.addEventListener("click", () => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${contador}</td>
                <td>
                    <input type="file" accept=".pdf" required>
                </td>
                <td>
                    <input type="email" placeholder="ejemplo@correo.com" required>
                </td>
                <td>
                    <button onclick="this.closest('tr').remove(); window.updateContador();">X</button>
                </td>
            `;
            tablaBody.appendChild(fila);
            window.updateContador(); // Actualiza el contador después de añadir
        });
    } else {
        console.error("Error: No se encontró el botón con el ID 'agregar-fila'.");
    }


    // Función global para actualizar el contador de filas
    window.updateContador = () => {
        const filas = tablaBody.querySelectorAll('tr');
        filas.forEach((fila, index) => {
            const numeroCelda = fila.querySelector('td:first-child');
            if (numeroCelda) { // Asegurarse de que la celda exista
                numeroCelda.textContent = index + 1;
            }
        });
        contador = filas.length + 1; // Actualiza el contador para la próxima fila
    };

    // Listener para el botón "Cargar CSV de Mails"
    if (btnCargarCsv) { // <--- ¡Verificación para btnCargarCsv!
        btnCargarCsv.addEventListener("click", () => {
            const file = csvFileInput.files[0];
            if (!file) {
                estado.textContent = "Por favor, selecciona un archivo CSV.";
                estado.style.color = "red";
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim() !== ''); // Ignorar líneas vacías

                // Limpiar la tabla antes de cargar nuevos datos del CSV
                tablaBody.innerHTML = '';
                // No resetear contador aquí, updateContador() se encargará al final del loop


                lines.forEach(line => {
                    const email = line.trim(); // Cada línea es un email
                    if (email) { // Asegurarse de que el email no esté vacío
                        const fila = document.createElement("tr");
                        fila.innerHTML = `
                            <td></td> <td>
                                <input type="file" accept=".pdf" required>
                            </td>
                            <td>
                                <input type="email" value="${email}" required>
                            </td>
                            <td>
                                <button onclick="this.closest('tr').remove(); window.updateContador();">X</button>
                            </td>
                        `;
                        tablaBody.appendChild(fila);
                        // No incrementar contador aquí, updateContador lo manejará para todas las filas
                    }
                });
                window.updateContador(); // <--- Llama a updateContador después de añadir todas las filas del CSV
                estado.textContent = `Emails cargados desde CSV.`;
                estado.style.color = "green";
            };
            reader.readAsText(file);
        });
    } else {
        console.error("Error: No se encontró el botón con el ID 'cargarCsv'.");
    }

    // Listener para el botón "Enviar todos"
    if (btnEnviar) {
        btnEnviar.addEventListener("click", async () => {
            const filas = tablaBody.querySelectorAll("tr");
            const formData = new FormData();
            const datos = [];

            let incompletos = false;

            if (filas.length === 0) {
                estado.textContent = "No hay recibos para enviar.";
                estado.style.color = "orange";
                return;
            }

            for (const fila of filas) {
                const fileInput = fila.querySelector('input[type="file"]');
                const emailInput = fila.querySelector('input[type="email"]');

                if (!fileInput || !fileInput.files[0] || !emailInput || !emailInput.value.trim()) {
                    incompletos = true;
                    break;
                }

                const archivo = fileInput.files[0];
                const email = emailInput.value.trim();

                formData.append("recibos", archivo);
                datos.push({
                    nombreArchivo: archivo.name,
                    email: email,
                });
            }

            if (incompletos) {
                estado.textContent = "Por favor, completa todos los campos de archivos y correos antes de enviar.";
                estado.style.color = "red";
                return;
            }

            formData.append("datos", JSON.stringify(datos));

            try {
                loader.style.display = 'block';
                estado.textContent = '';

                const response = await fetch("http://localhost:3000/enviar-recibos", {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });

                // --- MANEJO ESPECÍFICO PARA 401 UNAUTHORIZED (Sesión expirada) ---
                if (response.status === 401) {
                    estado.textContent = "Sesión expirada o no autorizada. Redirigiendo al inicio de sesión...";
                    estado.style.color = "orange";
                    setTimeout(() => {
                        window.location.href = "/FacmApp.html"; // Redirige al login
                    }, 1500); // Pequeña espera para que el usuario vea el mensaje
                    return; // Importante para detener la ejecución aquí
                }

                const data = await response.json(); // Solo intentará parsear JSON si no es 401

                if (response.ok) {
                    estado.textContent = data.message;
                    estado.style.color = "green";
                    tablaBody.innerHTML = '';
                    window.updateContador(); // Resetea y actualiza el contador después de limpiar la tabla
                } else {
                    estado.textContent = data.message || "Error al enviar recibos. Intenta de nuevo.";
                    estado.style.color = "red";
                }
            } catch (error) {
                console.error("Error al enviar recibos:", error);
                estado.textContent = "Error de conexión al servidor. Revisa tu conexión.";
                estado.style.color = "red";
            } finally {
                loader.style.display = 'none';
            }
        });
    } else {
        console.error("Error: No se encontró el botón con el ID 'enviar-todo'.");
    }

    // Asegurarse de que el contador se actualice al cargar la página (inicialmente)
    window.updateContador();
});