import React, {
  useImperativeHandle,
  useRef,
  RefAttributes,
  PropsWithoutRef
} from 'react';
import { useTable } from '@react-aria/table';

import { useTableState, TableStateProps } from '@react-stately/table';

import {
  SelectionMode,
  SelectionBehavior,
  CollectionChildren
} from '@react-types/shared';

import { Spacer } from '../index';
import { CSS } from '../theme/stitches.config';
import TableRowGroup from './table-row-group';
import TableColumnHeader from './table-column-header';
import TableHeaderRow from './table-header-row';
import TableSelectAllCheckbox from './table-select-all-checkbox';
import {
  TableColumn as TableColumnBase,
  TableCell as TableCellBase,
  TableRow as TableRowBase,
  TableBody as TableBodyBase,
  TableHeader as TableHeaderBase
} from './base';

import TablePagination from './table-pagination';
import TableFooter from './table-footer';
import TableBody from './table-body';
import { hasChild, pickSingleChild } from '../utils/collections';
import { StyledTable, TableVariantsProps } from './table.styles';
import TableContext, { TableConfig } from './table-context';
import { excludedTableProps } from '../utils/prop-types';
import { isInfinityScroll } from './utils';
import withDefaults from '../utils/with-defaults';
import clsx from '../utils/clsx';

interface Props<T> extends TableStateProps<T> {
  selectionMode?: SelectionMode;
  selectionBehavior?: SelectionBehavior;
  animated?: boolean;
  hideLoading?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

type NativeAttrs = Omit<
  React.TableHTMLAttributes<unknown>,
  keyof Props<object>
>;

export type TableProps<T = object> = Props<T> &
  NativeAttrs &
  Omit<TableVariantsProps, 'isMultiple'> & { css?: CSS };

const defaultProps = {
  animated: true,
  hideLoading: false,
  selectionMode: 'none',
  selectionBehavior: 'toggle'
};

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (tableProps, ref: React.Ref<HTMLTableElement | null>) => {
    const {
      selectionMode,
      selectionBehavior,
      hideLoading,
      children,
      ...props
    } = tableProps;

    const [withoutPaginationChildren, paginationChildren] = pickSingleChild<
      CollectionChildren<any>
    >(children, TablePagination);

    const hasPagination = hasChild(children, TablePagination);

    const state = useTableState({
      ...tableProps,
      children: withoutPaginationChildren,
      showSelectionCheckboxes:
        tableProps.showSelectionCheckboxes !== undefined
          ? tableProps.showSelectionCheckboxes
          : selectionMode === 'multiple' && selectionBehavior !== 'replace'
    });

    // clean table props
    Object.keys(props).forEach((propNameKey: any) => {
      if (excludedTableProps.indexOf(propNameKey) > -1) {
        // @ts-ignored
        delete props[propNameKey];
      }
    });

    const tableRef = useRef<HTMLTableElement | null>(null);

    useImperativeHandle(ref, () => tableRef?.current);

    const { collection } = state;
    const {
      gridProps
    }: {
      gridProps: Omit<React.HTMLAttributes<unknown>, keyof TableProps<unknown>>;
    } = useTable(tableProps, state, tableRef);

    const initialValues = React.useMemo<Partial<TableConfig>>(() => {
      return {
        collection,
        color: props.color,
        animated: props.animated
      };
    }, [collection, props.animated, props.color]);

    return (
      <TableContext.Provider defaultValues={initialValues}>
        <StyledTable
          ref={tableRef}
          hoverable={selectionMode !== 'none' || props.hoverable}
          isMultiple={selectionMode === 'multiple'}
          hasPagination={hasPagination}
          className={clsx('nextui-table', props.className)}
          {...gridProps}
          {...props}
        >
          <TableRowGroup as="thead" isFixed={isInfinityScroll(collection)}>
            {collection.headerRows.map((headerRow) => (
              <TableHeaderRow
                key={headerRow?.key}
                item={headerRow}
                state={state}
              >
                {[...headerRow.childNodes].map((column) =>
                  column?.props?.isSelectionCell ? (
                    <TableSelectAllCheckbox
                      key={column?.key}
                      column={column}
                      state={state}
                      color={props.color}
                      animated={props.animated}
                    />
                  ) : (
                    <TableColumnHeader
                      key={column?.key}
                      column={column}
                      state={state}
                      animated={props.animated}
                    />
                  )
                )}
              </TableHeaderRow>
            ))}
            {!props.sticked && (
              <Spacer as="tr" className="nextui-table-hidden-row" y={0.4} />
            )}
          </TableRowGroup>
          <TableBody
            state={state}
            color={props.color}
            collection={collection}
            animated={props.animated}
            hasPagination={hasPagination}
            hideLoading={hideLoading}
          />

          {hasPagination && (
            <TableFooter>
              <Spacer as="tr" className="nextui-table-hidden-row" y={0.6} />
              <tr role="row">
                <th
                  tabIndex={-1}
                  role="columnheader"
                  colSpan={collection.columnCount}
                >
                  {paginationChildren}
                </th>
              </tr>
            </TableFooter>
          )}
        </StyledTable>
      </TableContext.Provider>
    );
  }
);

type TableComponent<T, P = {}> = React.ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<T>
> & {
  Cell: typeof TableCellBase;
  Column: typeof TableColumnBase;
  Row: typeof TableRowBase;
  Header: typeof TableHeaderBase;
  Body: typeof TableBodyBase;
  Pagination: typeof TablePagination;
};

Table.displayName = 'NextUI - Table';
Table.toString = () => '.nextui-table';

export default withDefaults(Table, defaultProps) as TableComponent<
  HTMLTableElement,
  TableProps
>;
