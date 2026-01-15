// File: @/components/views/ManageSponsorships/msTableTw.ts

export const msTableTw = {
  // layout
  // ✅ Hide scrollbars (Firefox/IE/Edge/WebKit) but keep scrolling
  wrapper:
    'border-black -mt-[18px] overflow-x-auto overflow-y-auto rounded-xl border border-black ' +
    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',

  table: 'min-w-full border-collapse',
  theadRow: 'bg-[#2b2b2b] border-b border-black',

  // rows + zebra
  rowA: 'bg-[rgba(56,78,126,0.35)]',
  rowB: 'bg-[rgba(156,163,175,0.25)]',
  rowBorder: 'border-b border-slate-800',

  // ✅ NEW: apply vertical row spacing at the CELL level (not inner content)
  // Use these on <td> / <th> so zebra fills the entire buffer area.
  td: 'px-3 py-[3.5px] text-sm align-middle',
  td5: 'px-[5px] py-[3.5px] text-sm align-middle',

  // header + cells
  th: 'px-3 py-[3.5px] text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80',
  colFit: 'w-[1%] whitespace-nowrap',

  // 5px buffer for 1st + 3rd columns
  th5: 'px-[5px] py-[3.5px] text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80',

  // ✅ add +3px vertical buffer to header cells (top+bottom)
  thPad3: 'py-[6.5px]', // 3.5px + 3px
  th5Pad3: 'py-[6.5px]', // 3.5px + 3px

  // ✅ UPDATED: remove vertical padding from INNER wrappers (row spacing now lives on td/th)
  tdInner: 'w-full flex items-center',
  tdInnerCenter: 'w-full flex items-center justify-center',
  tdInner5: 'w-full flex items-center',
  tdInnerCenter5: 'w-full flex items-center justify-center',

  // clickable label cells (keep hover, remove vertical padding)
  linkCell:
    'border-0 w-full text-left flex items-center px-3 font-inherit text-inherit cursor-pointer hover:text-[#ec8840ff]',
  linkCell5:
    'border-0 w-full text-left flex items-center px-[5px] font-inherit text-inherit cursor-pointer hover:text-[#ec8840ff]',

  // buttons (keep padding INSIDE button; this is not row spacing)
  btnBase:
    'inline-flex items-center justify-center min-w-[76px] px-1.5 py-[3.5px] text-sm font-medium rounded-md transition-colors box-border whitespace-nowrap',
  btnOrange:
    'inline-flex items-center justify-center min-w-[76px] px-1.5 py-[3.5px] text-sm font-medium rounded-md transition-colors box-border whitespace-nowrap bg-[#ec8840ff] text-slate-900 hover:bg-[#c7610fff] hover:text-white',
  btnGreen:
    'inline-flex items-center justify-center min-w-[76px] px-1.5 py-[3.5px] text-sm font-medium rounded-md transition-colors box-border whitespace-nowrap bg-[#147f3bff] text-white hover:bg-[#22c55e] hover:text-slate-900',
} as const;
