import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (url.includes("sales-analysis")) {
      return Promise.resolve({ ok: true, json: async () => ({ body: { answer: "Análisis listo", intent: "top_products", period: { current: {}, previous: {} }, rows: [], ai: {} } }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ body: [] }) });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders the sales panel and analysis shortcuts", () => {
  render(<App />);
  expect(screen.getByText("Análisis de ventas")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /productos más vendidos/i })).toBeInTheDocument();
  expect(screen.getByLabelText("Fecha del reporte")).toBeInTheDocument();
});
