import { theme } from "@/styles/theme";
import type { ApexOptions } from "apexcharts";

export function getChartTheme(): "dark" | "light" {
  if (typeof document !== "undefined") {
    const mode = document.documentElement.getAttribute("data-theme") || "dark";
    return mode === "light" ? "light" : "dark";
  }
  return "dark";
}

export function baseChartOptions(cor: string): ApexOptions {
  const mode = getChartTheme();
  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
      width: "100%",
    },
    theme: { mode },
    grid: { show: false },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    yaxis: { show: false },
    xaxis: {
      categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#718096", fontSize: "11px" } },
    },
    colors: [cor],
    tooltip: { theme: mode },
  };
}

export function getBarOptions(): ApexOptions {
  const base = baseChartOptions(theme.colors.brand[500]);
  return {
    ...base,
    chart: { ...base.chart, id: "receita-bar", type: "bar" },
    stroke: { width: 0 },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "70%" } },
    yaxis: {
      show: true,
      labels: {
        show: true,
        style: { colors: "#718096" },
        formatter: (v) => `${Number(v).toLocaleString("pt-PT")} Kz`,
      },
    },
    fill: { type: "gradient", gradient: { shade: "dark", type: "vertical" } },
  };
}

export function getAreaOptions(): ApexOptions {
  const base = baseChartOptions(theme.colors.brand[500]);
  return {
    ...base,
    chart: { ...base.chart, id: "entregas-area", type: "area" },
    fill: { type: "gradient", gradient: { shade: "dark", type: "vertical", opacityFrom: 0.6, opacityTo: 0 } },
  };
}

export function getRadialBarOptions(): ApexOptions {
  const mode = getChartTheme();
  return {
    chart: { type: "radialBar", background: "transparent", toolbar: { show: false } },
    theme: { mode },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        hollow: { size: "60%" },
        track: { background: "transparent" },
        dataLabels: {
          name: { fontSize: "12px", color: "#AEB9E1" },
          value: { fontSize: "14px", fontWeight: "bold", color: "#E8EAFF" },
        },
      },
    },
    labels: ["Concluidas", "Em andamento", "Canceladas"],
    colors: ["#C026D3", "#3B82F6", "#00d5ff"],
    legend: {
      show: true,
      position: "bottom",
      labels: { colors: "#8B90B8" },
      markers: { size: 6, shape: "circle", strokeWidth: 0, fillColors: ["#C026D3", "#3B82F6", "#00d5ff"] },
    },
  };
}

export function getEarningsBarChartOptions(): ApexOptions {
  const base = baseChartOptions("#00B5D8");
  const mode = getChartTheme();
  return {
    ...base,
    chart: { ...base.chart, id: "Receitas-Mensais", type: "bar" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
    stroke: { curve: "smooth", width: 0 },
    yaxis: {
      labels: {
        style: { colors: "#718096" },
        formatter: (v) => `${Number(v).toLocaleString("pt-PT")} Kz`,
      },
    },
    fill: { type: "gradient", gradient: { shade: "dark", type: "vertical" } },
    colors: ["#00B5D8"],
    grid: { borderColor: "#2D3748" },
    tooltip: {
      theme: mode,
      y: { formatter: (v) => `${Number(v).toLocaleString("pt-PT")} Kz` },
    },
  };
}

// Keep legacy exports for backwards compatibility but they now resolve at call time
export const barOptions: ApexOptions = {} as ApexOptions;
export const areaOptions: ApexOptions = {} as ApexOptions;
export const radialBarOptions: ApexOptions = {} as ApexOptions;
export const EarningsBarChartOptions: ApexOptions = {} as ApexOptions;
