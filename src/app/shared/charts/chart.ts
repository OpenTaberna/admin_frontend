import { Component, ElementRef, OnDestroy, ViewChild, effect, input } from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartType,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

/**
 * Register only what the dashboard draws.
 *
 * Chart.js ships every controller, scale and plugin; importing the `auto`
 * bundle pulls all of them into the build. Registering explicitly keeps radar,
 * polar, doughnut and the rest out of the bundle.
 */
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

/**
 * A canvas chart.
 *
 * Deliberately thin, and deliberately not an Angular wrapper library. The app
 * runs zoneless and tracks the newest Angular, and a third-party wrapper adds
 * a dependency whose peer range gates every future Angular upgrade. Chart.js
 * itself has no opinion about the framework.
 *
 * Redraws whenever `config` changes: the chart is destroyed and rebuilt rather
 * than mutated, because partial updates across a changing dataset shape are a
 * reliable source of stale axes and orphaned tooltips.
 */
@Component({
  selector: 'ot-chart',
  standalone: true,
  template: `
    <div class="relative" [style.height.px]="height()">
      <canvas #canvas [attr.aria-label]="label()" role="img"></canvas>
    </div>
  `,
})
export class ChartComponent implements OnDestroy {
  readonly config = input.required<ChartConfiguration<ChartType>>();
  readonly height = input(280);
  /** Charts are images to a screen reader; the summary table carries the data. */
  readonly label = input('Chart');

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  constructor() {
    effect(() => {
      const config = this.config();
      // Read after config so the effect re-runs when the canvas first appears.
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) {
        return;
      }
      this.chart?.destroy();
      this.chart = new Chart(canvas, config);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
