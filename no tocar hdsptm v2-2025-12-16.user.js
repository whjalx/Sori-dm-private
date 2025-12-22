// ==UserScript==
// @name         no tocar hdsptm v2
// @namespace    http://tampermonkey.net/
// @version      2025-12-16
// @description  ayudando a los pobres perros devs de soriana
// @author       0xJc4st
// @match        https://omsmercurio.soriana.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=soriana.com
// @grant        none
// @run-at document-end
// ==/UserScript==


//De favor si no le saben no le muevan, en especial tu cesarin verga


(function() {
    'use strict';
document.querySelector(`input[placeholder="Search Order.."]`).placeholder = "Busqueda por Nombres/N.Orden"
document.querySelectorAll("th")[0].innerHTML = 'Nombre del Cliente '
    document.querySelectorAll("th")[2].innerHTML = 'Entrega en'
const rows = document.querySelectorAll("#tblConsulta_Embarcar tr");
rows.forEach(row => {
  const tds = row.querySelectorAll("td");

  if (tds.length > 10 && !isNaN(parseInt(tds[9].textContent))) {
    tds[10].innerHTML = `
      <a class="btn btn-primary" href="https://omsmercurio.soriana.com/Ordenes/RecepcionGuiaEmbarque?guia=${tds[9].textContent}">
        <i class="fa fa-print"></i>
      </a>
    `;
  }
});
    //const tds = table.querySelectorAll("td");
/*function agregarBotonPrint(tdIndex) {
  const valor = parseInt(tds[tdIndex].textContent, 10);

  if (!isNaN(valor)) {
    tds[tdIndex + 1].innerHTML = `
      <a class="btn btn-primary"
         href="#"
         style="padding-bottom:4px;margin-bottom:10px;margin-top:2px;">
        <i class="fa fa-print"></i>
      </a>
    `;
  }
}
const indices = [9, 22, 35, 48, 61, 74];

indices.forEach(agregarBotonPrint);
*/

 /*
    fetch("/Ordenes/OrdenDetalle?order=0006414511-1-0&especializada=True")
  .then(r => r.text())
  .then(html => {
    const doc = new DOMParser().parseFromString(html, "text/html");

const divs = doc.querySelectorAll('div.col-sm-4.text-left');

let nombreCliente = '';
divs.forEach(div => {
    const h4s = div.querySelectorAll('h4');
    h4s.forEach((h4, index) => {
        if(h4.textContent.includes('Nombre del Cliente:')) {
            // El siguiente h4 contiene el nombre real
            nombreCliente = h4s[index + 1].textContent.trim();
        }
    });
});

console.log('Nombre del Cliente:', nombreCliente);

  });

*/
 const filas = document.querySelectorAll('#tblConsulta_Surtido tbody tr');
 const filas2 = document.querySelectorAll('#tblConsulta_Embarcar tbody tr');
filas.forEach(async (fila) => {
    // Obtener el link de detalle de la orden
    const linkOrden = fila.querySelector('a[href*="/Ordenes/OrdenDetalle"]');
    if (!linkOrden) return;

    const urlParams = new URL(linkOrden.href, window.location.origin);
    const orderId = urlParams.searchParams.get('order');
    if (!orderId) return;

    // (1ª columna, índice 0)
    const tdCliente = fila.cells[0];
    const tdpend = fila.cells[8]
     const tddomi = fila.cells[2]
     tdCliente.textContent = 'UnU';
    try {
        const res = await fetch(`/Ordenes/OrdenDetalle?order=${orderId}&especializada=True`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        // hacer fetch a la otra pagina
        const divs = doc.querySelectorAll('div.col-sm-4.text-left');
         const check = doc.querySelectorAll("button")[0].textContent.trim()
         const domi = doc.querySelectorAll("div p span")[4].textContent.trim()

        let nombreCliente = '';


        divs.forEach(div => {
            const h4s = div.querySelectorAll('h4');
            h4s.forEach((h4, index) => {
                if (h4.textContent.includes('Nombre del Cliente:')) {
                    nombreCliente = h4s[index + 1]?.textContent.trim() || '';

                }
            });
        });
 if(domi == 'Dirección de entrega: Entrega en tienda'){
  tddomi.textContent ="TIENDA"
 }else{
  tddomi.textContent = "DOMICILIO"
 }

        if(check == 'Cambiar Surtidor'){
  tdpend.textContent ="PENDIENTE"
     tdpend.style.background = "Orange"
     tdpend.style.color = "blue"
 }
        // Actualizar la celda con el nombre del cliente pdj
        if (nombreCliente) tdCliente.innerHTML =`<a href="https://omsmercurio.soriana.com/Ordenes/OrdenDetalle?order=${orderId}&especializada=True">${nombreCliente} </a>`;
    } catch (err) {
        console.error('Error al obtener detalle de la orden', orderId, err);
        tdCliente.textContent = 'Error';
    }
});

    filas2.forEach(async (fila) => {
    // Obtener el link de detalle de la orden
    const linkOrden = fila.querySelector('a[href*="/Ordenes/ConsultaDetalle"]');
    if (!linkOrden) return;

    const urlParams = new URL(linkOrden.href, window.location.origin);
    const orderId = urlParams.searchParams.get('order');
    if (!orderId) return;

    // (1ª columna, índice 0)
    const tdCliente = fila.cells[0];
 const td = fila.cells[0];
     tdCliente.textContent = 'UnU';
    try {
        const res = await fetch(`/Ordenes/OrdenDetalle?order=${orderId}&especializada=True`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        // hacer fetch a la otra pagina
        const divs = doc.querySelectorAll('div.col-sm-4.text-left');
        let nombreCliente = '';
        divs.forEach(div => {
            const h4s = div.querySelectorAll('h4');
            h4s.forEach((h4, index) => {
                if (h4.textContent.includes('Nombre del Cliente:')) {
                    nombreCliente = h4s[index + 1]?.textContent.trim() || '';
                }
            });
        });
        // Actualizar la celda con el nombre del cliente pdj
        if (nombreCliente) tdCliente.textContent = nombreCliente;
    } catch (err) {
        console.error('Error al obtener detalle de la orden', orderId, err);
        tdCliente.textContent = 'Error';
    }
});
})();