import * as React from "react";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type RowData,
  type SortDirection,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";

type DataTableColumnMeta = {
  /** Applied to the column's header and body cells, e.g. "text-right". */
  className?: string;
};

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnMeta: {} as DataTableColumnMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;

export type DataTableColumnDef<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  any
>;

/** Column helper bound to the DataTable's feature set. */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

type DataTableProps<TData extends RowData> = {
  /** Define outside the component (or memoize) so the table isn't rebuilt every render. */
  columns: DataTableColumnDef<TData>[];
  /** `undefined` is accepted so query results can be passed straight through. */
  data: TData[] | undefined;
  /** Stable ids keep selection attached to the right rows across refetches. */
  getRowId?: (row: TData) => string;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  /** Shows a search box that filters across all accessor columns. */
  enableSearch?: boolean;
  searchPlaceholder?: string;
  /** Shows a dropdown for toggling hideable columns. */
  enableColumnVisibility?: boolean;
  /** Prepends a checkbox column. */
  enableRowSelection?: boolean;
  /** Rendered in the toolbar while at least one row is selected. */
  selectionActions?: (
    selectedRows: TData[],
    clearSelection: () => void,
  ) => React.ReactNode;
  /** Extra toolbar content, rendered on the right. */
  toolbar?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  className?: string;
};

const EMPTY_DATA: never[] = [];

/**
 * Wrapper around the table primitives that handles sorting, search, column
 * visibility, row selection and pagination. Columns with a string `header`
 * and an accessor get a sort toggle automatically.
 */
export function DataTable<TData extends RowData>({
  columns,
  data = EMPTY_DATA,
  getRowId,
  isLoading = false,
  emptyMessage,
  enableSearch = false,
  searchPlaceholder,
  enableColumnVisibility = false,
  enableRowSelection = false,
  selectionActions,
  toolbar,
  pageSize = 10,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const { t } = useTranslation();
  const tableColumns = React.useMemo(
    () => (enableRowSelection ? [selectColumn<TData>(), ...columns] : columns),
    [columns, enableRowSelection],
  );

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: tableColumns,
    getRowId,
    enableRowSelection,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const pageCount = table.getPageCount();
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  const showSelectionActions = !!selectionActions && selectedRows.length > 0;
  const showToolbar =
    enableSearch ||
    showSelectionActions ||
    !!toolbar ||
    (enableColumnVisibility && hideableColumns.length > 0);

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {enableSearch && (
            <InputGroup className="max-w-sm">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={table.state.globalFilter ?? ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                placeholder={
                  searchPlaceholder ?? t("dataTable.searchPlaceholder")
                }
              />
            </InputGroup>
          )}
          {showSelectionActions &&
            selectionActions(selectedRows, () => table.resetRowSelection())}
          <div className="ml-auto flex items-center gap-2">
            {toolbar}
            {enableColumnVisibility && hideableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {t("dataTable.columns")} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {hideableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      // Keep the menu open so several columns can be toggled.
                      onSelect={(event) => event.preventDefault()}
                    >
                      {columnLabel(column)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const title = header.column.columnDef.header;
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(header.column.columnDef.meta?.className)}
                    >
                      {header.isPlaceholder ? null : typeof title ===
                          "string" && header.column.getCanSort() ? (
                        <SortableHeader
                          title={title}
                          direction={header.column.getIsSorted()}
                          onToggle={header.column.getToggleSortingHandler()}
                        />
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
                <TableRow key={index}>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        "text-sm",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage ?? t("dataTable.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(enableRowSelection || pageCount > 1) && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <div>
            {enableRowSelection &&
              t("dataTable.rowsSelected", {
                selected: selectedRows.length,
                count: table.getFilteredRowModel().rows.length,
              })}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <span>
                {t("dataTable.pageOf", {
                  page: table.state.pagination.pageIndex + 1,
                  pageCount,
                })}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label={t("common.a11y.previousPage")}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label={t("common.a11y.nextPage")}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  title,
  direction,
  onToggle,
}: {
  title: string;
  direction: false | SortDirection;
  onToggle: ((event: unknown) => void) | undefined;
}) {
  const Icon =
    direction === "asc"
      ? ArrowUp
      : direction === "desc"
        ? ArrowDown
        : ArrowUpDown;
  return (
    // Margin cancels the head's px-2 so the label lines up with the cells
    // below; padding must not exceed it or the button overflows the table.
    <Button variant="ghost" size="sm" className="-mx-2 px-2" onClick={onToggle}>
      {title}
      <Icon className={cn(!direction && "text-muted-foreground")} />
    </Button>
  );
}

function selectColumn<TData extends RowData>(): DataTableColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={i18n.t("dataTable.selectAll")}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        // Don't trigger onRowClick when toggling selection.
        onClick={(event) => event.stopPropagation()}
        aria-label={i18n.t("dataTable.selectRow")}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

function columnLabel<TData extends RowData>(
  column: Column<DataTableFeatures, TData, unknown>,
) {
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
}
