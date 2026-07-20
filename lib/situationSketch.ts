import { SchetsData } from "./types";

/* Eenvoudige AI-gestuurde schematische bovenaanzicht-tekening (canvas), op schaal van SCHETS_BOX (351 x 151 pt) x 4 voor scherpte. */
export function generateSchetsDataUrl(schets: SchetsData): string {
  const W = 351 * 4;
  const H = 151 * 4;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas niet beschikbaar");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  function road() {
    if (!ctx) return;
    ctx.fillStyle = "#e9ecf1";
    if (schets.wegtype === "kruising") {
      ctx.fillRect(W / 2 - 70, 0, 140, H);
      ctx.fillRect(0, H / 2 - 70, W, 140);
    } else if (schets.wegtype === "rotonde") {
      ctx.fillRect(0, H / 2 - 70, W, 140);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 80, 0, Math.PI * 2);
      ctx.fillStyle = "#dfe3ea";
      ctx.fill();
      ctx.strokeStyle = "#b7bec9";
      ctx.stroke();
    } else if (schets.wegtype === "parkeerplaats") {
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#c7cdd6";
      ctx.lineWidth = 2;
      for (let x = 40; x < W; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, H - 20);
        ctx.stroke();
      }
    } else {
      ctx.fillRect(0, H / 2 - 70, W, 140);
      ctx.strokeStyle = "#c7cdd6";
      ctx.setLineDash([14, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function carPos(pos: string, isA: boolean) {
    const laneOffset = 34;
    let cx = isA ? W * 0.32 : W * 0.68;
    let cy = H / 2;
    if (schets.wegtype === "kruising") {
      cx = W / 2;
      cy = isA ? H * 0.68 : H * 0.32;
    }
    if (pos === "links") cy -= laneOffset;
    if (pos === "rechts") cy += laneOffset;
    if (pos === "geparkeerd") {
      cx = isA ? W * 0.18 : W * 0.82;
      cy = H * 0.18;
    }
    return { cx, cy };
  }

  function drawCar(cx: number, cy: number, richting: string, label: string, color: string) {
    if (!ctx) return;
    ctx.save();
    let angle = 0;
    if (richting === "boven") angle = -Math.PI / 2;
    if (richting === "onder") angle = Math.PI / 2;
    if (richting === "links") angle = Math.PI;
    if (richting === "rechts") angle = 0;
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#20304f";
    ctx.lineWidth = 3;
    const w = 64;
    const h = 30;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    else ctx.rect(-w / 2, -h / 2, w, h);
    ctx.fill();
    ctx.stroke();
    if (richting !== "stilstaand") {
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2 - 14, -10);
      ctx.lineTo(w / 2 - 14, 10);
      ctx.closePath();
      ctx.fillStyle = "#20304f";
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = "#12213f";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy - 26);
  }

  road();
  const a = carPos(schets.positie_A, true);
  const b = carPos(schets.positie_B, false);
  drawCar(a.cx, a.cy, schets.richting_A, "A", "#3a5aa6");
  drawCar(b.cx, b.cy, schets.richting_B, "B", "#c9832f");

  const midx = (a.cx + b.cx) / 2;
  const midy = (a.cy + b.cy) / 2;
  ctx.strokeStyle = "#B5432F";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(midx - 12, midy - 12);
  ctx.lineTo(midx + 12, midy + 12);
  ctx.moveTo(midx + 12, midy - 12);
  ctx.lineTo(midx - 12, midy + 12);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}
