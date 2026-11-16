import { getDynamicNavItems, subscribeToNavigationUpdates } from "@/addons/addons-runtime-context";
import { Icons } from "@wealthfolio/ui/components/ui/icons";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getAddonNavPinKey, useAddonNavigationPins } from "./addon-navigation-pins";

export interface NavLink {
  id?: string;
  title: string;
  href: string;
  icon?: ReactNode;
  keywords?: string[];
  label?: string; // Optional descriptive label for launcher/search
}

export interface NavigationProps {
  /** Primary items the menus show: `allPrimary` minus the ones hidden in Appearance settings. */
  primary: NavLink[];
  /** Every primary item, hidden or not; search and the tab stacks still need hidden pages. */
  allPrimary: NavLink[];
  showConnect: boolean;
  secondary?: NavLink[];
  addons?: NavLink[];
  addonMenuItems?: NavLink[];
  pinnedAddons?: NavLink[];
  setAddonPinned?: (item: NavLink, pinned: boolean) => void;
}

export const CONNECT_NAV_HREF = "/connect";
export const HIDDEN_NAV_ITEMS_STORAGE_KEY = "wealthfolio:hidden-nav-items";

/** Hrefs the user hid from the navigation menus, stored per profile. */
export function useHiddenNavItems() {
  const [hiddenHrefs, setHiddenHrefs] = usePersistentState<string[]>(
    HIDDEN_NAV_ITEMS_STORAGE_KEY,
    [],
  );
  const setNavItemHidden = useCallback(
    (href: string, hidden: boolean) => {
      setHiddenHrefs((current) => {
        if (hidden) return current.includes(href) ? current : [...current, href];
        return current.filter((item) => item !== href);
      });
    },
    [setHiddenHrefs],
  );
  return { hiddenHrefs, setNavItemHidden };
}

type TFunction = ReturnType<typeof useTranslation>["t"];

export function buildStaticNavigation(
  t: TFunction,
): Pick<NavigationProps, "primary" | "secondary"> {
  return {
    primary: [
      {
        icon: <Icons.Insight className="size-6" />,
        title: t("common:dashboard"),
        href: "/dashboard",
        keywords: ["home", "overview", "summary"],
        label: t("common:nav.label_dashboard"),
      },
      {
        icon: <Icons.Dashboard className="size-6" />,
        title: t("common:insights"),
        href: "/insights",
        keywords: ["insights", "Analytics"],
        label: t("common:nav.label_insights"),
      },
      {
        icon: <Icons.Holdings className="size-6" />,
        title: t("common:holdings"),
        href: "/holdings",
        keywords: ["Holdings", "portfolio", "assets", "positions", "stocks"],
        label: t("common:nav.label_holdings"),
      },
      {
        icon: <Icons.Activity className="size-6" />,
        title: t("common:activities"),
        href: "/activities",
        keywords: ["transactions", "trades", "history"],
        label: t("common:nav.label_activities"),
      },
      {
        icon: <Icons.Goals className="size-6" />,
        title: t("common:goals"),
        href: "/goals",
        keywords: ["goals", "fire", "retire", "retirement", "savings", "planner"],
        label: t("common:nav.label_goals"),
      },
      {
        icon: <Icons.Sparkles className="size-6" />,
        title: t("common:assistant"),
        href: "/assistant",
        keywords: ["ai", "assistant", "chat", "help", "ask"],
        label: t("common:nav.label_assistant"),
      },
    ],
    secondary: [
      {
        icon: <Icons.Settings className="size-6" />,
        title: t("common:settings"),
        href: "/settings",
        keywords: ["preferences", "config", "configuration"],
      },
    ],
  };
}

export function useNavigation() {
  const { t } = useTranslation();
  const staticNavigation = useMemo(() => buildStaticNavigation(t), [t]);
  const { hiddenHrefs } = useHiddenNavItems();
  const [dynamicItems, setDynamicItems] = useState<NavigationProps["addons"]>([]);
  const { hasConfiguredAddonPins, pinnedAddonIdSet, setAddonPinned, setPinnedAddonIds } =
    useAddonNavigationPins();

  // Subscribe to navigation updates from addons
  useEffect(() => {
    const updateDynamicItems = () => {
      const itemsFromRuntime = getDynamicNavItems();
      setDynamicItems(itemsFromRuntime);
    };

    // Initial load
    updateDynamicItems();

    // Subscribe to updates
    const unsubscribe = subscribeToNavigationUpdates(updateDynamicItems);

    return () => {
      unsubscribe();
    };
  }, []);

  // Spending lives entirely on the dashboard tab (and its deep-linked pages);
  // no top-level nav entry. Combine static navigation items with addons.
  const allPrimary = staticNavigation.primary;
  const primary = useMemo(
    () => allPrimary.filter((item) => !hiddenHrefs.includes(item.href)),
    [allPrimary, hiddenHrefs],
  );
  const addons = useMemo(() => dynamicItems ?? [], [dynamicItems]);

  useEffect(() => {
    if (hasConfiguredAddonPins || addons.length !== 1) {
      return;
    }

    const onlyAddonId = getAddonNavPinKey(addons[0]);
    setPinnedAddonIds((currentIds) =>
      currentIds.includes(onlyAddonId) ? currentIds : [...currentIds, onlyAddonId],
    );
  }, [addons, hasConfiguredAddonPins, setPinnedAddonIds]);

  const pinnedAddons = useMemo(
    () => addons.filter((item) => pinnedAddonIdSet.has(getAddonNavPinKey(item))),
    [addons, pinnedAddonIdSet],
  );
  const addonMenuItems = useMemo(
    () => addons.filter((item) => !pinnedAddonIdSet.has(getAddonNavPinKey(item))),
    [addons, pinnedAddonIdSet],
  );
  const navigation: NavigationProps = {
    primary,
    allPrimary,
    showConnect: !hiddenHrefs.includes(CONNECT_NAV_HREF),
    secondary: staticNavigation.secondary,
    addons,
    addonMenuItems,
    pinnedAddons,
    setAddonPinned,
  };

  return navigation;
}

export function isPathActive(pathname: string, href: string): boolean {
  if (!href) {
    return false;
  }

  const ensureLeadingSlash = href.startsWith("/") ? href : `/${href}`;
  const normalize = (value: string) => {
    if (value.length > 1 && value.endsWith("/")) {
      return value.slice(0, -1);
    }
    return value;
  };

  const normalizedHref = normalize(ensureLeadingSlash);
  const normalizedPath = normalize(pathname);

  if (normalizedHref === "/") {
    return normalizedPath === "/";
  }

  // Dashboard and Net Worth are grouped together
  if (normalizedHref === "/dashboard") {
    return (
      normalizedPath === "/" || normalizedPath === "/dashboard" || normalizedPath === "/net-worth"
    );
  }

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}
