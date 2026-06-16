import { renderPlanSvg } from './renderSvg.js';

export async function exportPlanPdf(model, options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('PDF export only works in the browser.');
  }

  const [{ jsPDF }] = await Promise.all([
    import('jspdf'),
    import('svg2pdf.js'),
  ]);

  const filename = options.filename || defaultFilename(model, 'pdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const mount = document.createElement('div');

  mount.style.position = 'fixed';
  mount.style.left = '-10000px';
  mount.style.top = '0';
  mount.style.visibility = 'hidden';
  document.body.appendChild(mount);

  try {
    for (let i = 0; i < model.sheets.length; i += 1) {
      if (i > 0) pdf.addPage('a3', 'landscape');
      const { svg } = renderPlanSvg(model, { level: model.sheets[i].level });
      mount.innerHTML = svg;
      const element = mount.querySelector('svg');
      if (!element) continue;
      await pdf.svg(element, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
      mount.innerHTML = '';
    }
  } finally {
    mount.remove();
  }

  if (options.download !== false) pdf.save(filename);
  return pdf;
}

function defaultFilename(model, ext) {
  const name = (model?.meta?.viviendaLabel || 'plano').toLowerCase().replace(/\s+/g, '-');
  return `${name}-reforma.${ext}`;
}
