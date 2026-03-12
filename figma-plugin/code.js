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

  const MARGIN = 90;
  const PALETTE = ["#97643D", "#99994C", "#19331C", "#408070", "#508040", "#804040"];

  const page = figma.currentPage;

  // ── Root frame ────────────────────────────────────────────────────
  const root = figma.createFrame();
  root.name = "Avatar Generator";
  root.resize(1440, 900);
  root.fills = solid("#1a1a1a");
  root.clipsContent = true;
  page.appendChild(root);

  // ── Avatar circle ─────────────────────────────────────────────────
  const avatarFrame = figma.createFrame();
  avatarFrame.name = "Avatar";
  avatarFrame.resize(308, 308);
  avatarFrame.x = MARGIN;
  avatarFrame.y = MARGIN;
  avatarFrame.fills = solid("#1a1a1a");
  avatarFrame.cornerRadius = 154;
  avatarFrame.clipsContent = true;
  root.appendChild(avatarFrame);

  // Background fill (takes first palette color when name is typed)
  const avatarBg = figma.createRectangle();
  avatarBg.name = "Avatar BG";
  avatarBg.resize(308, 308);
  avatarBg.fills = solid(PALETTE[0]);
  avatarFrame.appendChild(avatarBg);

  // Blobs — individually filtered, soft-light blend on b2/b3
  const blobs = [
    { name: "Blob 1", cx: 154, cy: 68,  r: 180, color: PALETTE[0], blend: "NORMAL" },
    { name: "Blob 2", cx: 228, cy: 198, r: 180, color: PALETTE[2], blend: "SOFT_LIGHT" },
    { name: "Blob 3", cx: 80,  cy: 198, r: 180, color: PALETTE[4], blend: "SOFT_LIGHT" },
  ];
  for (const b of blobs) {
    const el = figma.createEllipse();
    el.name = b.name;
    el.resize(b.r * 2, b.r * 2);
    el.x = b.cx - b.r;
    el.y = b.cy - b.r;
    el.fills = solid(b.color, 0.9);
    el.blendMode = b.blend;
    el.effects = [{ type: "LAYER_BLUR", radius: 26, visible: true }];
    avatarFrame.appendChild(el);
  }

  // Initials
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

  // ── Controls panel (top-right) ────────────────────────────────────
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
    row.appendChild(lbl);

    const iconL = makeIconRect(`${labelText} lo`);
    iconL.x = LABEL_W + COL_GAP;
    row.appendChild(iconL);

    const slider = makeSlider(pct);
    slider.x = LABEL_W + COL_GAP + ICON_W + COL_GAP;
    slider.y = (ICON_H - 9) / 2;
    row.appendChild(slider);

    const iconR = makeIconRect(`${labelText} hi`);
    iconR.x = LABEL_W + COL_GAP + ICON_W + COL_GAP + SLIDER_W + COL_GAP;
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
  palRow.appendChild(palLbl);

  let swatchX = LABEL_W + COL_GAP;
  for (const c of PALETTE) {
    const s = figma.createEllipse();
    s.name = `Swatch ${c}`;
    s.resize(16, 16);
    s.x = swatchX;
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
  controlsGroup.x = 1440 - MARGIN - PANEL_W;
  controlsGroup.y = MARGIN;

  // ── Name input (bottom-left) ──────────────────────────────────────
  const nameInput = figma.createText();
  nameInput.name = "Name Input";
  nameInput.fontName = { family: "Inter", style: "Medium" };
  nameInput.fontSize = 100;
  nameInput.letterSpacing = { value: -2, unit: "PIXELS" };
  nameInput.characters = "type your name";
  nameInput.fills = solid("#C4C4C4", 0.35);
  nameInput.x = MARGIN;
  root.appendChild(nameInput);
  nameInput.y = 900 - MARGIN - nameInput.height;

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

  diceBtn.x = 1440 - MARGIN - diceBtn.width;
  diceBtn.y = 900 - MARGIN - diceBtn.height;
  clearBtn.x = diceBtn.x - 20 - clearBtn.width;
  clearBtn.y = diceBtn.y + (diceBtn.height - clearBtn.height) / 2;

  figma.viewport.scrollAndZoomIntoView([root]);
  figma.closePlugin("Done — Avatar Generator updated.");
})();
