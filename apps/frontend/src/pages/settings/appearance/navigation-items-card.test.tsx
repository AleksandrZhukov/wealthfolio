import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useNavigation } from "@/pages/layouts/navigation/app-navigation";
import { NavigationItemsCard } from "./navigation-items-card";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

beforeEach(() => localStorage.clear());

it("hides Goals and Connect from the menus but keeps them for search", () => {
  render(<NavigationItemsCard />);
  expect(screen.queryByRole("switch", { name: "common:dashboard" })).toBeNull();

  fireEvent.click(screen.getByRole("switch", { name: "common:goals" }));
  fireEvent.click(screen.getByRole("switch", { name: "common:connect" }));
  expect(screen.getByRole("switch", { name: "common:goals" })).not.toBeChecked();

  const { result } = renderHook(() => useNavigation());
  expect(result.current.primary.map((item) => item.href)).not.toContain("/goals");
  expect(result.current.allPrimary.map((item) => item.href)).toContain("/goals");
  expect(result.current.showConnect).toBe(false);
});
