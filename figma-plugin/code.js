(async () => {
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  function hex(h) {
    h = h.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
    };
  }
  function solid(color, opacity = 1) {
    return [{ type: "SOLID", color: hex(color), opacity }];
  }

  const page = figma.currentPage;

  // ── Root frame ────────────────────────────────────────────────────
  const root = figma.createFrame();
  root.name = "Avatar Generator";
  root.resize(1440, 900);
  root.fills = solid("#1a1a1a");
  root.clipsContent = true;
  page.appendChild(root);

  // ── Avatar circle (top-left, 32px inset) ─────────────────────────
  const avatarFrame = figma.createFrame();
  avatarFrame.name = "Avatar";
  avatarFrame.resize(308, 308);
  avatarFrame.x = 32;
  avatarFrame.y = 32;
  avatarFrame.fills = solid("#C4C4C4");
  avatarFrame.cornerRadius = 154;
  avatarFrame.clipsContent = true;
  root.appendChild(avatarFrame);

  const blobs = [
    { name: "Blob Apex",  w: 230, h: 230, x: 38,  y: -50,  color: "#5C85FF" },
    { name: "Blob Right", w: 210, h: 210, x: 110, y: 110,  color: "#9B59B6" },
    { name: "Blob Left",  w: 190, h: 190, x: -30, y: 130,  color: "#00BCD4" },
  ];
  for (const b of blobs) {
    const el = figma.createEllipse();
    el.name = b.name;
    el.resize(b.w, b.h);
    el.x = b.x;
    el.y = b.y;
    el.fills = solid(b.color, 0.9);
    el.blendMode = "SCREEN";
    el.effects = [{ type: "LAYER_BLUR", radius: 26, visible: true }];
    avatarFrame.appendChild(el);
  }

  const initials = figma.createText();
  initials.name = "Initials";
  initials.fontName = { family: "Inter", style: "Medium" };
  initials.fontSize = 123;
  initials.characters = "AB";
  initials.fills = solid("#FFFFFF");
  initials.textAlignHorizontal = "CENTER";
  initials.textAlignVertical = "CENTER";
  initials.resize(308, 308);
  initials.x = 0;
  initials.y = 0;
  avatarFrame.appendChild(initials);

  // ── Controls panel (top-right, 32px inset) ───────────────────────
  const LABEL_W  = 98;
  const ICON_W   = 26;
  const ICON_H   = 18;
  const SLIDER_W = 132;
  const ROW_GAP  = 22;
  const COL_GAP  = 8;
  const PANEL_W  = LABEL_W + COL_GAP + ICON_W + COL_GAP + SLIDER_W + COL_GAP + ICON_W;

  function makeSlider(pct) {
    const track = figma.createFrame();
    track.name = "Slider";
    track.resize(SLIDER_W, 9);
    track.fills = [];
    track.clipsContent = false;

    const empty = figma.createRectangle();
    empty.name = "Track";
    empty.resize(SLIDER_W, 2);
    empty.y = 4;
    empty.fills = solid("#333333");
    track.appendChild(empty);

    const filled = figma.createRectangle();
    filled.name = "Filled";
    filled.resize(Math.round(SLIDER_W * pct), 2);
    filled.y = 4;
    filled.fills = solid("#888888");
    track.appendChild(filled);

    const thumb = figma.createEllipse();
    thumb.name = "Thumb";
    thumb.resize(9, 9);
    thumb.x = Math.round(SLIDER_W * pct) - 4;
    thumb.y = 0;
    thumb.fills = solid("#AAAAAA");
    track.appendChild(thumb);

    return track;
  }

  function makeIconRect(name) {
    const r = figma.createRectangle();
    r.name = name;
    r.resize(ICON_W, ICON_H);
    r.fills = solid("#666666", 0.4);
    r.cornerRadius = 2;
    return r;
  }

  async function makeCtrlRow(labelText, pct) {
    const row = figma.createFrame();
    row.name = labelText;
    row.fills = [];
    row.resize(PANEL_W, ICON_H);
    row.clipsContent = false;

    const lbl = figma.createText();
    lbl.fontName = { family: "Inter", style: "Medium" };
    lbl.fontSize = 12;
    lbl.characters = labelText;
    lbl.fills = solid("#666666");
    lbl.letterSpacing = { value: 8, unit: "PERCENT" };
    lbl.textAlignHorizontal = "RIGHT";
    lbl.resize(LABEL_W, ICON_H);
    lbl.x = 0;
    lbl.y = 0;
    row.appendChild(lbl);

    const iconL = makeIconRect(`${labelText} icon-lo`);
    iconL.x = LABEL_W + COL_GAP;
    iconL.y = 0;
    row.appendChild(iconL);

    const slider = makeSlider(pct);
    slider.x = LABEL_W + COL_GAP + ICON_W + COL_GAP;
    slider.y = (ICON_H - 9) / 2;
    row.appendChild(slider);

    const iconR = makeIconRect(`${labelText} icon-hi`);
    iconR.x = LABEL_W + COL_GAP + ICON_W + COL_GAP + SLIDER_W + COL_GAP;
    iconR.y = 0;
    row.appendChild(iconR);

    return row;
  }

  const controlsGroup = figma.createFrame();
  controlsGroup.name = "Controls";
  controlsGroup.fills = [];
  controlsGroup.clipsContent = false;

  const sliderDefs = [
    ["TURBULENCE",   0.30],
    ["OCTAVES",      0.50],
    ["DISPLACEMENT", 0.65],
    ["BLUR",         0.55],
    ["GRAIN",        0.20],
  ];

  let rowY = 0;
  for (const [label, pct] of sliderDefs) {
    const row = await makeCtrlRow(label, pct);
    row.x = 0;
    row.y = rowY;
    controlsGroup.appendChild(row);
    rowY += ICON_H + ROW_GAP;
  }

  // Divider
  const divider = figma.createRectangle();
  divider.name = "Divider";
  divider.resize(PANEL_W, 1);
  divider.x = 0;
  divider.y = rowY;
  divider.fills = solid("#2A2A2A");
  controlsGroup.appendChild(divider);
  rowY += 1 + ROW_GAP;

  // Palette row
  const palRow = figma.createFrame();
  palRow.name = "PALETTE";
  palRow.fills = [];
  palRow.clipsContent = false;
  palRow.resize(PANEL_W, 16);

  const palLbl = figma.createText();
  palLbl.fontName = { family: "Inter", style: "Medium" };
  palLbl.fontSize = 12;
  palLbl.characters = "PALETTE";
  palLbl.fills = solid("#666666");
  palLbl.letterSpacing = { value: 8, unit: "PERCENT" };
  palLbl.textAlignHorizontal = "RIGHT";
  palLbl.resize(LABEL_W, 16);
  palLbl.x = 0;
  palLbl.y = 0;
  palRow.appendChild(palLbl);

  const swatchColors = ["#5C85FF", "#9B59B6", "#00BCD4", "#26A69A", "#FFC107", "#8BC34A"];
  let swatchX = LABEL_W + COL_GAP;
  for (const c of swatchColors) {
    const s = figma.createEllipse();
    s.name = `Swatch ${c}`;
    s.resize(16, 16);
    s.x = swatchX;
    s.y = 0;
    s.fills = solid(c);
    s.strokes = [{ type: "SOLID", color: hex("#C4C4C4"), opacity: 0.4 }];
    s.strokeWeight = 1;
    palRow.appendChild(s);
    swatchX += 16 + 7;
  }

  // GEN pill
  const genPill = figma.createFrame();
  genPill.name = "GEN Pill";
  genPill.fills = solid("#333333");
  genPill.strokes = [{ type: "SOLID", color: hex("#484848") }];
  genPill.strokeWeight = 1;
  genPill.cornerRadius = 99;
  genPill.layoutMode = "HORIZONTAL";
  genPill.paddingTop = 3;
  genPill.paddingBottom = 3;
  genPill.paddingLeft = 9;
  genPill.paddingRight = 9;
  genPill.primaryAxisSizingMode = "AUTO";
  genPill.counterAxisSizingMode = "AUTO";

  const genText = figma.createText();
  genText.fontName = { family: "Inter", style: "Medium" };
  genText.fontSize = 10;
  genText.characters = "GEN";
  genText.fills = solid("#AAAAAA");
  genText.letterSpacing = { value: 9, unit: "PERCENT" };
  genPill.appendChild(genText);
  genPill.x = swatchX + 4;
  genPill.y = -1;
  palRow.appendChild(genPill);

  palRow.x = 0;
  palRow.y = rowY;
  controlsGroup.appendChild(palRow);
  rowY += 16;

  controlsGroup.resize(PANEL_W, rowY);
  root.appendChild(controlsGroup);
  controlsGroup.x = 1440 - 32 - PANEL_W;
  controlsGroup.y = 32;

  // ── Name input (bottom-left, 32px inset) ─────────────────────────
  const nameInput = figma.createText();
  nameInput.name = "Name Input";
  nameInput.fontName = { family: "Inter", style: "Medium" };
  nameInput.fontSize = 90;
  nameInput.characters = "type your name";
  nameInput.fills = solid("#C4C4C4", 0.35);
  nameInput.x = 32;
  root.appendChild(nameInput);
  nameInput.y = 900 - 32 - nameInput.height;

  // ── Bottom-right buttons ──────────────────────────────────────────
  const clearBtn = figma.createText();
  clearBtn.name = "CLEAR";
  clearBtn.fontName = { family: "Inter", style: "Medium" };
  clearBtn.fontSize = 16;
  clearBtn.characters = "CLEAR";
  clearBtn.fills = solid("#666666");
  clearBtn.letterSpacing = { value: 10, unit: "PERCENT" };
  root.appendChild(clearBtn);

  const diceBtn = figma.createText();
  diceBtn.name = "Dice";
  diceBtn.fontName = { family: "Inter", style: "Regular" };
  diceBtn.fontSize = 26;
  diceBtn.characters = "⚄";
  diceBtn.fills = solid("#666666");
  root.appendChild(diceBtn);

  // Align buttons to bottom-right
  const btnY = 900 - 32 - Math.max(clearBtn.height, diceBtn.height);
  clearBtn.y = btnY + (diceBtn.height - clearBtn.height) / 2;
  diceBtn.y = btnY;
  diceBtn.x = 1440 - 32 - diceBtn.width;
  clearBtn.x = diceBtn.x - 20 - clearBtn.width;

  figma.viewport.scrollAndZoomIntoView([root]);
  figma.closePlugin("Done! Your Avatar Generator design is ready.");
})();
