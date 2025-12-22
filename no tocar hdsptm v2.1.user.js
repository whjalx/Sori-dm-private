// ==UserScript==
// @name         no tocar hdsptm v2.1 (optimizado)
// @namespace    http://tampermonkey.net/
// @version      2025-12-16
// @description  menos fetch, menos lag
// @author       0xJc4st
// @match        https://omsmercurio.soriana.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  /* =========================
     Utilidades
  ========================== */

  const orderCache = new Map();

  const getOrderIdFromLink = (link, param = 'order') => {
    try {
      return new URL(link.href, location.origin).searchParams.get(param);
    } catch {
      return null;
    }
  };

  const fetchOrderDetail = async (orderId) => {
    if (orderCache.has(orderId)) return orderCache.get(orderId);

    const promise = fetch(`/Ordenes/OrdenDetalle?order=${orderId}&especializada=True`)
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Nombre cliente
        let nombre = '';
        doc.querySelectorAll('div.col-sm-4.text-left h4')
          .forEach((h4, i, arr) => {
            if (h4.textContent.includes('Nombre del Cliente:')) {
              nombre = arr[i + 1]?.textContent.trim() || '';
            }
          });

        const boton = doc.querySelector('button');
        const estado = boton?.textContent.trim() || '';

        const spans = doc.querySelectorAll('div p span');
        const domicilio = spans[4]?.textContent.trim() || '';

        return { nombre, estado, domicilio };
      })
      .catch(() => null);

    orderCache.set(orderId, promise);
    return promise;
  };

  /* =========================
     Ajustes UI rápidos
  ========================== */

  const search = document.querySelector('input[placeholder="Search Order.."]');
  if (search) search.placeholder = 'Busqueda por Nombres/N.Orden';

  const ths = document.querySelectorAll('th');
  if (ths[0]) ths[0].textContent = 'Nombre del Cliente';
  if (ths[2]) ths[2].textContent = 'Entrega en';

  /* =========================
     Botón imprimir (Embarcar)
  ========================== */

  document
    .querySelectorAll('#tblConsulta_Embarcar tr')
    .forEach(row => {
      const tds = row.cells;
      const guia = parseInt(tds?.[9]?.textContent, 10);
      if (!isNaN(guia) && tds[10]) {
        tds[10].innerHTML = `
          <a class="btn btn-primary"
             href="/Ordenes/RecepcionGuiaEmbarque?guia=${guia}">
            <i class="fa fa-print"></i>
          </a>`;
      }
    });

  /* =========================
     Procesar tablas
  ========================== */

  const procesarFila = async (fila, tipo) => {
    const link = fila.querySelector('a[href*="/Ordenes/"]');
    if (!link) return;

    const orderId = getOrderIdFromLink(link);
    if (!orderId) return;

    const tdCliente = fila.cells[0];
    tdCliente.textContent = 'UnU';

    const data = await fetchOrderDetail(orderId);
    if (!data) {
      tdCliente.textContent = 'Error';
      return;
    }

    const { nombre, estado, domicilio } = data;

    if (nombre) {
      tdCliente.innerHTML =
        `<a href="/Ordenes/OrdenDetalle?order=${orderId}&especializada=True">${nombre}</a>`;
    }

    if (tipo === 'surtido') {
      const tdEntrega = fila.cells[2];
      const tdPendiente = fila.cells[8];

      if (tdEntrega) {
        tdEntrega.textContent =
          domicilio === 'Dirección de entrega: Entrega en tienda'
            ? 'TIENDA'
            : 'DOMICILIO';
      }

      if (estado === 'Cambiar Surtidor' && tdPendiente) {
        tdPendiente.textContent = 'PENDIENTE';
        tdPendiente.style.background = 'orange';
      }
    }
  };

  const surtido = [...document.querySelectorAll('#tblConsulta_Surtido tbody tr')];
  const embarcar = [...document.querySelectorAll('#tblConsulta_Embarcar tbody tr')];

  Promise.all([
    ...surtido.map(f => procesarFila(f, 'surtido')),
    ...embarcar.map(f => procesarFila(f, 'embarcar'))
  ]);

})();