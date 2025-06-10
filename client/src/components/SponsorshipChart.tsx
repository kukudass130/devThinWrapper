import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SponsorshipChart() {
  const [period, setPeriod] = useState("month");
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Import Chart.js dynamically to avoid SSR issues
    import('chart.js/auto').then((Chart) => {
      const ctx = document.getElementById('sponsorshipChart') as HTMLCanvasElement;
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (chartData) {
        chartData.destroy();
      }

      let labels: string[];
      let data: number[];

      switch (period) {
        case 'week':
          labels = ['월', '화', '수', '목', '금', '토', '일'];
          data = [3, 1, 4, 2, 5, 2, 1];
          break;
        case 'quarter':
          labels = ['1월', '2월', '3월'];
          data = [45, 38, 52];
          break;
        default: // month
          labels = ['1주', '2주', '3주', '4주'];
          data = [12, 8, 15, 10];
      }

      const newChart = new Chart.Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: '협찬 제의 수',
            data,
            backgroundColor: 'hsl(207, 90%, 54%)',
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true,
                color: 'hsl(214.3, 31.8%, 91.4%)'
              },
              ticks: {
                color: 'hsl(215.4, 16.3%, 46.9%)'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'hsl(215.4, 16.3%, 46.9%)'
              }
            }
          }
        }
      });

      setChartData(newChart);
    });

    return () => {
      if (chartData) {
        chartData.destroy();
      }
    };
  }, [period]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">최근 1주일</SelectItem>
            <SelectItem value="month">최근 1달</SelectItem>
            <SelectItem value="quarter">최근 3개월</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-64">
        <canvas id="sponsorshipChart"></canvas>
      </div>
    </div>
  );
}
