/**
 * 한경컨센서스 리포트 목록 클라이언트.
 *
 * 목록 HTML에서 메타데이터만 추출한다. 원문 PDF는 다운로드하지 않는다.
 */
import * as cheerio from 'cheerio';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_RECENT_DAYS,
  DEFAULT_REPORT_TYPE,
  DEFAULT_SEARCH_FIELD,
  HANKYUNG_CONSENSUS_BASE_URL,
  HANKYUNG_REPORT_LIST_ENDPOINT,
  MAX_PAGE_SIZE,
  REPORT_TYPE_LABELS
} from './config';
import { hankyungGet } from './http';
import type { FetchRecentReportsOptions, HankyungReport } from './types';

export async function fetchRecentReports(opts: FetchRecentReportsOptions = {}): Promise<HankyungReport[]> {
  const keyword = (opts.stockName ?? opts.keyword ?? '').trim();
  const pageSize = opts.stockName ? MAX_PAGE_SIZE : clampPageSize(opts.limit ?? DEFAULT_PAGE_SIZE);
  const html = await hankyungGet(HANKYUNG_REPORT_LIST_ENDPOINT, {
    skinType: DEFAULT_REPORT_TYPE,
    sdate: opts.startDate ?? daysAgo(DEFAULT_RECENT_DAYS),
    edate: opts.endDate ?? today(),
    search_value: keyword ? DEFAULT_SEARCH_FIELD : '',
    search_text: keyword,
    pagenum: pageSize,
    now_page: 1,
    order_type: ''
  });

  const reports = parseReportList(html, REPORT_TYPE_LABELS[DEFAULT_REPORT_TYPE] ?? DEFAULT_REPORT_TYPE).filter((report) => {
    if (!opts.stockName) return true;
    return report.stockName === opts.stockName.trim();
  });
  return typeof opts.limit === 'number' ? reports.slice(0, opts.limit) : reports;
}

export function parseReportList(html: string, fallbackReportType: string): HankyungReport[] {
  const $ = cheerio.load(html);
  const reports: HankyungReport[] = [];

  $('.table_style01 tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 6) return;

    const firstReportLink = $(row).find('td.text_l a[href*="/analysis/downpdf"]').first();
    const href = firstReportLink.attr('href');
    if (!href) return;

    const title = normalizeText(firstReportLink.text());
    if (!title) return;

    const isBusinessTable = cells.length >= 9;
    const publishedDate = normalizeText(cells.eq(0).text());
    const reportType = isBusinessTable ? fallbackReportType : normalizeText(cells.eq(1).text()) || fallbackReportType;
    const authorIndex = isBusinessTable ? 4 : 3;
    const firmIndex = isBusinessTable ? 5 : 4;
    const stock = parseStockFromTitle(title);

    reports.push({
      title,
      securitiesFirm: normalizeText(cells.eq(firmIndex).text()),
      stockName: stock.name,
      stockCode: stock.code,
      reportType,
      publishedDate,
      originalUrl: new URL(href, HANKYUNG_CONSENSUS_BASE_URL).toString(),
      author: nullable(normalizeText(cells.eq(authorIndex).text()))
    });
  });

  return reports;
}

function parseStockFromTitle(title: string): { name: string | null; code: string | null } {
  const match = title.match(/^(.+?)\((\d{6})\)/);
  if (!match) {
    return { name: null, code: null };
  }

  return {
    name: normalizeText(match[1]),
    code: match[2]
  };
}

function clampPageSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(Math.trunc(value), MAX_PAGE_SIZE));
}

function today(): string {
  return formatDate(new Date());
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function nullable(value: string): string | null {
  return value && value !== '-' ? value : null;
}
