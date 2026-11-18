export default async function install(app) {
 const layer = app.layers[app.config.layerId];
 app.assert(layer, 'Lake District fells layer not found');
 await layer.load();
 const mount = app.getMount('fell-color-controls');
 const ranges = [0, 456.1, 912.2];
 const schemes = {
  'blue-red': ['#2166ac','#f7f7f7','#b2182b'],
  'blue-orange': ['#2166ac','#f7f7f7','#d6604d'],
  'purple-red': ['#762a83','#f7f7f7','#b2182b']
 };
 let colors = [...schemes['blue-red']];
 const stack = document.createElement('div');
 stack.style.cssText = 'display:grid;gap:14px;min-width:0;color:var(--app-text);';
 const intro = document.createElement('p');
 intro.textContent = 'Triangle size shows height (37–978 m). Color shows prominence (0–912 m).';
 intro.style.cssText = 'margin:0;color:var(--app-text-muted);line-height:1.45;';
 stack.append(intro);
 const label = document.createElement('div');
 label.textContent = 'Color ramp';
 label.style.cssText = 'font-weight:600;';
 stack.append(label);
 const select = document.createElement('calcite-select');
 select.setAttribute('label','Prominence color ramp');
 for (const [value, text] of [['blue-red','Blue to red'],['blue-orange','Blue to orange'],['purple-red','Purple to red']]) {
  const option = document.createElement('calcite-option');
  option.value = value;
  option.textContent = text;
  select.append(option);
 }
 select.value = 'blue-red';
 stack.append(select);
 const strip = document.createElement('div');
 strip.setAttribute('aria-label','Color samples from low to high prominence');
 strip.style.cssText = 'display:flex;width:100%;height:20px;border:1px solid var(--app-border);border-radius:var(--app-radius);overflow:hidden;';
 const segments = ranges.map(() => {
  const part = document.createElement('span');
  part.style.cssText='flex:1;min-width:0;';
  strip.append(part);
  return part;
 });
 stack.append(strip);
 const caption = document.createElement('p');
 caption.textContent = 'Adjust each sample to customize the ramp in this session.';
 caption.style.cssText = 'margin:0;color:var(--app-text-muted);';
 stack.append(caption);
 const pickers = [];
 for (const [index, title] of ['Low · 0 m','Mid · 456 m','High · 912 m'].entries()) {
  const row = document.createElement('div');
  row.style.cssText = 'display:grid;gap:6px;min-width:0;padding:8px;border:1px solid var(--app-border);border-radius:var(--app-radius);background:var(--app-surface);';
  const heading = document.createElement('span');
  heading.textContent=title;
  heading.style.fontWeight='600';
  const sample = document.createElement('div');
  sample.style.cssText='width:100%;height:24px;border:1px solid var(--app-border);border-radius:var(--app-radius);';
  const picker = document.createElement('calcite-color-picker');
  picker.setAttribute('scale','s');
  picker.setAttribute('aria-label',title+' color');
  picker.value = colors[index];
  const onPicker = () => {
   const value = String(picker.value || '').toLowerCase();
   if (!/^#[0-9a-f]{6}$/.test(value)) return;
   colors[index] = value;
   refresh();
  };
  picker.addEventListener('calciteColorPickerChange',onPicker);
  app.onCleanup(() => picker.removeEventListener('calciteColorPickerChange',onPicker));
  pickers.push({picker,sample});
  row.append(heading,sample,picker);
  stack.append(row);
 }
 function refresh() {
  for (let i=0;i<3;i++) {
   segments[i].style.backgroundColor=colors[i];
   pickers[i].sample.style.backgroundColor=colors[i];
  }
  const renderer = layer.renderer.clone();
  const variables = renderer.visualVariables.map(v => v.clone());
  const colorVar = variables.find(v => v.type === 'color' && v.field === 'Drop_');
  app.assert(colorVar,'Prominence color variable missing');
  colorVar.stops = ranges.map((value,i) => ({value,color:colors[i],label:i===0?'0 m':i===2?'912 m':undefined}));
  renderer.visualVariables=variables;
  layer.renderer=renderer;
 }
 const onSelect = () => {
  colors=[...schemes[select.value]];
  pickers.forEach(({picker},i) => {picker.value=colors[i];});
  refresh();
 };
 select.addEventListener('calciteSelectChange',onSelect);
 app.onCleanup(() => select.removeEventListener('calciteSelectChange',onSelect));
 mount.replaceChildren(stack);
 refresh();
 app.onCleanup(() => mount.replaceChildren());
}