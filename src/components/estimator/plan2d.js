import {
  buildPlanModel,
  downloadPlanPng,
  exportPlanPdf,
  renderPlanSvg,
} from './export/index.js';

export function buildPlanSVG(rooms, setup = {}, dateStr = '') {
  const model = buildPlanModel(rooms, setup, { dateStr });
  return renderPlanSvg(model);
}

export function openPlanPDF(rooms, setup = {}) {
  const model = buildPlanModel(rooms, setup);
  return exportPlanPdf(model);
}

export function downloadPlanPNG(rooms, setup = {}, filename = 'plano-reforma.png') {
  const model = buildPlanModel(rooms, setup);
  return downloadPlanPng(model, { filename });
}
