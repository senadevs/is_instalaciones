import { exportPlanDxf as buildPlanDxf } from './exportDxf.js';
import { exportPlanPdf } from './exportPdf.js';
import { buildPlanModel } from './model.js';
import { renderPlanSvg } from './renderSvg.js';

export { buildPlanModel, exportPlanPdf, renderPlanSvg };

export function exportPlanDxf(model, options = {}) {
  return buildPlanDxf(model, options);
}

export function hasPlanErrors(model) {
  return model?.validations?.some((issue) => issue.severity === 'error');
}

export function getPlanErrors(model) {
  return (model?.validations || []).filter((issue) => issue.severity === 'error');
}

export function downloadPlanSvg(model, options = {}) {
  const { svg } = renderPlanSvg(model, options);
  const filename = options.filename || defaultFilename(model, 'svg');
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename);
  return svg;
}

export function downloadPlanDxf(model, options = {}) {
  const dxf = exportPlanDxf(model);
  const filename = options.filename || defaultFilename(model, 'dxf');
  downloadBlob(new Blob([dxf], { type: 'application/dxf;charset=utf-8' }), filename);
  return dxf;
}

export async function downloadPlanPng(model, options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('PNG export only works in the browser.');
  }

  const { svg, width, height } = renderPlanSvg(model, options);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  const scale = options.scale || 2;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not create PNG canvas context.'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not build PNG blob.'));
          return;
        }
        const filename = options.filename || defaultFilename(model, 'png');
        downloadBlob(blob, filename);
        resolve(blob);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not render SVG as PNG.'));
    };
    img.src = url;
  });
}

export function serializeProjectJson(state) {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    estimator: state,
  }, null, 2);
}

export function downloadProjectJson(state, options = {}) {
  const json = serializeProjectJson(state);
  downloadBlob(
    new Blob([json], { type: 'application/json;charset=utf-8' }),
    options.filename || 'estimador-reforma.json',
  );
  return json;
}

export function downloadBlob(blob, filename) {
  if (typeof document === 'undefined') {
    throw new Error('Download helpers only work in the browser.');
  }

  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function defaultFilename(model, ext) {
  const name = (model?.meta?.viviendaLabel || 'plano').toLowerCase().replace(/\s+/g, '-');
  return `${name}-reforma.${ext}`;
}
