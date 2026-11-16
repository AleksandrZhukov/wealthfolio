import {
  CONNECT_NAV_HREF,
  buildStaticNavigation,
  useHiddenNavItems,
} from "@/pages/layouts/navigation/app-navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wealthfolio/ui/components/ui/card";
import { Icons } from "@wealthfolio/ui/components/ui/icons";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@wealthfolio/ui/components/ui/item";
import { Switch } from "@wealthfolio/ui/components/ui/switch";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

/** Lets the user hide navigation items they never use. Dashboard and Settings always stay. */
export function NavigationItemsCard() {
  const { t } = useTranslation();
  const { hiddenHrefs, setNavItemHidden } = useHiddenNavItems();
  const items = [
    ...buildStaticNavigation(t).primary.filter((item) => item.href !== "/dashboard"),
    { title: t("common:connect"), href: CONNECT_NAV_HREF, icon: <Icons.Cloud /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-lg">
          {t("settings:appearance_menu_items_title")}
        </CardTitle>
        <CardDescription>{t("settings:appearance_menu_items_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.map((item, index) => (
          <Fragment key={item.href}>
            {index > 0 && <ItemSeparator />}
            <Item size="sm" className="px-0">
              <ItemMedia className="[&_svg]:size-5!">{item.icon}</ItemMedia>
              <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Switch
                  aria-label={item.title}
                  checked={!hiddenHrefs.includes(item.href)}
                  onCheckedChange={(visible) => setNavItemHidden(item.href, !visible)}
                />
              </ItemActions>
            </Item>
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}
