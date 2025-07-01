// public/script.js

document.addEventListener("DOMContentLoaded", () => {
    const tablaBody = document.getElementById("tabla-body");
    const btnAgregar = document.getElementById("agregar-fila");
    const btnEnviar = document.getElementById("enviar-todo");
    const estado = document.getElementById("estado");
    const loader = document.getElementById("loader");

    const csvFileInput = document.getElementById("csvFileInput");
    const btnCargarCsv = document.getElementById("cargarCsv"); 

    console.log("btnEnviar antes de addEventListener:", btnEnviar);
    console.log("btnCargarCsv antes de addEventListener:", btnCargarCsv);


    let contador = 1;

  
    if (btnAgregar) { 
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
            window.updateContador(); 
        });
    } else {
        console.error("Error: No se encontró el botón con el ID 'agregar-fila'.");
    }


   
    window.updateContador = () => {
        const filas = tablaBody.querySelectorAll('tr');
        filas.forEach((fila, index) => {
            const numeroCelda = fila.querySelector('td:first-child');
            if (numeroCelda) { 
                numeroCelda.textContent = index + 1;
            }
        });
        contador = filas.length + 1; 
    };

   
    if (btnCargarCsv) { 
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
                const lines = text.split('\n').filter(line => line.trim() !== ''); 

            
                tablaBody.innerHTML = '';
                


                lines.forEach(line => {
                    const email = line.trim(); 
                    if (email) {
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
                        
                    }
                });
                window.updateContador(); 
                estado.textContent = `Emails cargados desde CSV.`;
                estado.style.color = "green";
            };
            reader.readAsText(file);
        });
    } else {
        console.error("Error: No se encontró el botón con el ID 'cargarCsv'.");
    }

    
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

             
                if (response.status === 401) {
                    estado.textContent = "Sesión expirada o no autorizada. Redirigiendo al inicio de sesión...";
                    estado.style.color = "orange";
                    setTimeout(() => {
                        window.location.href = "/FacmApp.html"; 
                    }, 1500);
                    return; 
                }

                const data = await response.json(); 

                if (response.ok) {
                    estado.textContent = data.message;
                    estado.style.color = "green";
                    tablaBody.innerHTML = '';
                    window.updateContador(); 
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

   
    window.updateContador();
});
