// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderStatus } from "@/types";

afterEach(() => {
  cleanup();
});

describe("OrderStatusBadge", () => {
  it("renders the status text in human-readable format", () => {
    render(<OrderStatusBadge status="out-for-delivery" />);
    expect(screen.getByText("Out For Delivery")).toBeInTheDocument();
  });

  it("capitalizes single-word statuses", () => {
    render(<OrderStatusBadge status="received" />);
    expect(screen.getByText("Received")).toBeInTheDocument();
  });

  it("applies indigo styles for received status", () => {
    render(<OrderStatusBadge status="received" />);
    const badge = screen.getByText("Received");
    expect(badge.className).toContain("bg-indigo-100");
  });

  it("applies amber styles for preparing status", () => {
    render(<OrderStatusBadge status="preparing" />);
    const badge = screen.getByText("Preparing");
    expect(badge.className).toContain("bg-amber-100");
  });

  it("applies green styles for ready status", () => {
    render(<OrderStatusBadge status="ready" />);
    const badge = screen.getByText("Ready");
    expect(badge.className).toContain("bg-green-100");
  });

  it("applies emerald styles for served status", () => {
    render(<OrderStatusBadge status="served" />);
    const badge = screen.getByText("Served");
    expect(badge.className).toContain("bg-emerald-100");
  });

  it("applies emerald styles for collected status", () => {
    render(<OrderStatusBadge status="collected" />);
    const badge = screen.getByText("Collected");
    expect(badge.className).toContain("bg-emerald-100");
  });

  it("applies purple styles for out-for-delivery status", () => {
    render(<OrderStatusBadge status="out-for-delivery" />);
    const badge = screen.getByText("Out For Delivery");
    expect(badge.className).toContain("bg-purple-100");
  });

  it("applies green styles for delivered status", () => {
    render(<OrderStatusBadge status="delivered" />);
    const badge = screen.getByText("Delivered");
    expect(badge.className).toContain("bg-green-100");
  });

  it("passes additional className to the badge", () => {
    render(<OrderStatusBadge status="ready" className="ml-2" />);
    const badge = screen.getByText("Ready");
    expect(badge.className).toContain("ml-2");
  });

  it("renders all valid statuses without error", () => {
    const statuses: OrderStatus[] = [
      "received",
      "preparing",
      "ready",
      "served",
      "collected",
      "out-for-delivery",
      "delivered",
    ];

    statuses.forEach((status) => {
      const { unmount } = render(<OrderStatusBadge status={status} />);
      expect(screen.getByText(/\w+/)).toBeInTheDocument();
      unmount();
    });
  });
});
