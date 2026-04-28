"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import useDebounce from "@/hooks/useDebounce";
import { DataTable, Column, PaginationInfo } from "@/components/ui/DataTable";
import SummaryCards from "@/components/ui/SummaryCards";
import { CustomDropdown } from "@/components/ui/Dropdown";
import SearchInput from "@/components/ui/SearchInput";
import Button from "../../../components/ui/Button";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface ContentItem {
  _id: string;
  contentType: string;
  textContent?: {
    title: string;
    description: string;
    label: string;
    image: string;
  };
  unlocksAt: string; // Format expected: "HH.mm" (e.g., "04.53" or "16.20")
  date: string;
  isActive: boolean;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  createdAt: string;
}

export default function TextManagementPage() {
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [queryState, setQueryState] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setQueryState((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // ─── Helper: Format Time to 12-Hour AM/PM ──────────────────────────────────
  const formatPublishTime = (dateStr: string, timeStr: string) => {
    try {
      // 1. Date format (DD MMM YYYY)
      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // 2. Time conversion (24h "04.53" -> 12h "04:53 AM")
      // Replacing '.' with ':' to make it standard time format
      const [hours, minutes] = timeStr.replace(".", ":").split(":");
      let hh = parseInt(hours);
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12;
      hh = hh ? hh : 12; // 0 should be 12
      const formattedTime = `${hh.toString().padStart(2, "0")}:${minutes} ${ampm}`;

      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      return { date: dateStr, time: timeStr };
    }
  };

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", queryState.page.toString());
      params.append("limit", queryState.limit.toString());
      if (queryState.search) params.append("search", queryState.search);
      if (queryState.status) params.append("status", queryState.status);

      const response = await axiosInstance.get(`/daily-content/text?${params.toString()}`, getConfig());
      
      if (response.data.success) {
        const { content, pagination: meta } = response.data.data;
        setContentList(content || []);
        setPagination({
          currentPage: meta?.currentPage || 1,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.totalItems || 0,
          itemsPerPage: queryState.limit,
          hasNextPage: meta?.currentPage < meta?.totalPages,
          hasPrevPage: meta?.currentPage > 1,
        });
      }
    } catch (error: any) {
      toast.error("Failed to fetch content");
      setContentList([]);
    } finally {
      setLoading(false);
    }
  }, [queryState]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // ─── Table Columns ────────────────────────────────────────────────────────
  const columns: Column<ContentItem>[] = [
    {
      key: "image",
      header: "Image",
      cell: (item) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
          {item.textContent?.image ? (
            <img src={item.textContent.image} alt="thumb" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon icon="mdi:image-off-outline" className="text-gray-300 w-5 h-5" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "Content Information",
      cell: (item) => (
        <div className="max-w-xs">
          <p className="text-sm font-bold text-gray-900 truncate">
            {item.textContent?.title || "Untitled"}
          </p>
          <p className="text-xs text-gray-500 line-clamp-1">
            {item.textContent?.description}
          </p>
        </div>
      ),
    },
    {
      key: "publishAt",
      header: "Publish At",
      cell: (item) => {
        const { date, time } = formatPublishTime(item.date, item.unlocksAt);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-700">{date}</span>
            <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
              <Icon icon="mdi:clock-outline" /> {time}
            </span>
          </div>
        );
      },
    },
    {
      key: "label",
      header: "Label",
      cell: (item) => (
        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
          {item.textContent?.label || "None"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (item) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Link
          href={`/dashboard/text/${item._id}/edit`}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
        >
          <Icon icon="mdi:pencil-box-outline" className="w-5 h-5" />
        </Link>
      ),
    },
  ];

  const summaryCards = [
    { label: "Total Updates", value: pagination.totalItems, icon: "mdi:format-text", color: "blue" },
    { label: "Total Likes", value: contentList.reduce((a, b) => a + (b.likesCount || 0), 0), icon: "mdi:heart", color: "red" },
    { label: "Total Bookmarks", value: contentList.reduce((a, b) => a + (b.bookmarksCount || 0), 0), icon: "mdi:bookmark", color: "amber" },
    { label: "Active Content", value: contentList.filter(i => i.isActive).length, icon: "mdi:check-circle", color: "emerald" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header Section with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Text Management</h1>
          <p className="text-sm text-gray-500 mt-1">Management of daily text-based updates.</p>
        </div>
        <Link href="/dashboard/text/add">
          <Button icon="mdi:plus" className="bg-primary-600 hover:bg-primary-700">
            Add Text
          </Button>
        </Link>
      </div>

      <SummaryCards data={summaryCards as any} />

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl border z-50 border-gray-100 shadow-sm rounded-2xl ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 p-3">
          <div className="lg:col-span-9 w-full">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by title or label..."
            />
          </div>
          <div className="lg:col-span-3 w-full">
            <CustomDropdown
              icon="mdi:filter-variant"
              placeholder="Status"
              options={[
                { value: "", label: "All Status" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              value={queryState.status}
              onChange={(val: any) => setQueryState((p) => ({ ...p, status: val as string, page: 1 }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={contentList}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setQueryState((p) => ({ ...p, page }))}
          emptyTitle="No Content Found"
          emptyDescription="Try adjusting your search or filters."
        />
      </div>
    </div>
  );
}