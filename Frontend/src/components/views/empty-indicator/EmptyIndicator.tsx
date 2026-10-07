import { cn } from "@/lib/utils";
import type React from "react";
import { useTranslation } from "react-i18next";

type Props = {
  message?: string | React.ReactNode;
};

const EmptyIndicator = ({ message }: Props) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-row justify-center items-center text-muted-foreground w-full h-full py-2",
      )}
    >
      {message && <span>{message}</span>}
      {!message && <>{t("dataTable.noData")}</>}
    </div>
  );
};

export default EmptyIndicator;
