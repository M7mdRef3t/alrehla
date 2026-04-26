"use client";
export const dynamic = "force-dynamic";
import dynamic_import from "next/dynamic";

const WeatherForecastClient = dynamic_import(
  () => import("./WeatherForecastClient"),
  { ssr: false }
);

export default function WeatherPage() {
  return <WeatherForecastClient />;
}
