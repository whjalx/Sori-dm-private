// ==UserScript==
// @name         no tocar hdsptm v2.2
// @namespace    http://tampermonkey.net/
// @version      2025-12-16
// @description  fetch mínimo, DOM mínimo, filtros funcionando
// @author       0xJc4st
// @match        https://omsmercurio.soriana.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  /* =========================
     CACHE GLOBAL (PROMISE)
  ========================== */

  const orderCache = new Map();

  const getOrderId = a => {
    try {
      return new URL(a.href, location.origin).searchParams.get('order');
    } catch {
      return null;
    }
  };

  const fetchOrder = orderId => {
    if (orderCache.has(orderId)) return orderCache.get(orderId);

    const p = fetch(`/Ordenes/OrdenDetalle?order=${orderId}&especializada=True`)
      .then(r => r.text())
      .then(html => {
        const d = new DOMParser().parseFromString(html, 'text/html');

        const nombre =
          [...d.querySelectorAll('h4')]
            .find(h => h.textContent.includes('Nombre del Cliente:'))
            ?.nextElementSibling?.textContent.trim() || '';

        const estado = d.querySelector('button')?.textContent.trim() || '';

        const domicilio =
          d.querySelectorAll('div p span')[4]?.textContent.trim() || '';

        return { nombre, estado, domicilio };
      })
      .catch(() => null);

    orderCache.set(orderId, p);
    return p;
  };

  /* =========================
     UI BÁSICA
  ========================== */

  const search = document.querySelector('input[placeholder="Search Order.."]');
  if (search) search.placeholder = 'Busqueda por Nombres / Orden';

  const ths = document.querySelectorAll('th');
  if (ths[0]) ths[0].textContent = 'Nombre del Cliente';
  if (ths[2]) ths[2].textContent = 'Entrega en';

  /* =========================
     BOTÓN IMPRIMIR (EMBARCAR)
  ========================== */

  const embarcarRows =
    document.querySelectorAll('#tblConsulta_Embarcar tbody tr');

  embarcarRows.forEach(r => {
    const guia = parseInt(r.cells?.[9]?.textContent, 10);
    if (!isNaN(guia) && r.cells[10]) {
      r.cells[10].innerHTML =
        `<a class="btn btn-primary"
            href="/Ordenes/RecepcionGuiaEmbarque?guia=${guia}">
            <i class="fa fa-print"></i>
         </a>`;
    }
  });

  /* =========================
     PROCESAMIENTO DE FILAS
  ========================== */

  const procesarFila = async (row, tipo) => {
    const a = row.querySelector('a[href*="/Ordenes/"]');
    if (!a) return;

    const orderId = getOrderId(a);
    if (!orderId) return;

    const tdCliente = row.cells[0];
    tdCliente.textContent = 'Cargando...';

    const data = await fetchOrder(orderId);
    if (!data) {
      tdCliente.textContent = 'Error';
      return;
    }

    const { nombre, estado, domicilio } = data;

    if (nombre) {
      tdCliente.innerHTML =
        `<a href="/Ordenes/OrdenDetalle?order=${orderId}&especializada=True">
          ${nombre}
         </a>`;
    }

    if (tipo === 'surtido') {
      const tdEntrega = row.cells[2];
      const tdPendiente = row.cells[8];

      if (tdEntrega) {
        tdEntrega.textContent =
          domicilio.toLowerCase().includes('tienda')
            ? 'TIENDA'
            : 'DOMICILIO';
      }

      if (estado === 'Cambiar Surtidor' && tdPendiente) {
        tdPendiente.textContent = 'PENDIENTE';
        tdPendiente.style.background = 'Orange';
      }
    }
  };

  /* =========================
     EJECUCIÓN PARALELA
  ========================== */

  const tareas = [];

  document
    .querySelectorAll('#tblConsulta_Surtido tbody tr')
    .forEach(r => tareas.push(procesarFila(r, 'surtido')));

  embarcarRows
    .forEach(r => tareas.push(procesarFila(r, 'embarcar')));

  Promise.all(tareas);

  /* =========================
     BOTONES DE FILTRO
  ========================== */

  const input = document.querySelector('#txtFiltroSurtir');
  if (input && !document.querySelector('#filtrosRapidos')) {

    const cont = document.querySelectorAll('div.row')[3];
    cont.id = 'filtrosRapidos';
    cont.style.marginBottom = '8px';

    const filtros = [
      ['Pendiente', 'PENDIENTE', '#f0ad4e'],
      ['Domicilio', 'DOMICILIO', '#5cb85c'],
      ['Tienda', 'TIENDA', '#0275d8'],
      ['Todo', '', '#d9534f']
    ];

    const frag = document.createDocumentFragment();

    filtros.forEach(([txt, val, col]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = txt;
      b.style.cssText =
        `margin-right:6px;padding:6px 12px;border:none;
         border-radius:4px;cursor:pointer;color:#fff;
         background:${col};opacity:1`;

      b.onclick = () => {
        input.value = val;

        // EVENTOS REALES
        input.dispatchEvent(new KeyboardEvent('keyup', {
          bubbles: true,
          cancelable: true,
          key: 'a'
        }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        cont.querySelectorAll('button')
          .forEach(x => x.style.opacity = '1');
        b.style.opacity = '0.6';
      };

      frag.appendChild(b);
    });

    cont.appendChild(frag);
    input.parentNode.insertBefore(cont, input);
  }

})();
