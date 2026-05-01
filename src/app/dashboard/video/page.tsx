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
  videoContent?: {
    title: string;
    videoUrl: string;
    thumbnail: string;
    description: string;
    isAutoMute: boolean;
    hasListenOnlyMode: boolean;
    durationSeconds?: number;
  };
  unlocksAt: string;
  date: string;
  isActive: boolean;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  createdAt: string;
}

export default function VideoManagementPage() {
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

  // ─── Helper: Format Time & Date ───────────────────────────────────────────
  const formatPublishTime = (dateStr: string, timeStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const [hours, minutes] = timeStr.replace(".", ":").split(":");
      let hh = parseInt(hours);
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12 || 12;
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

      const response = await axiosInstance.get(`/daily-content/video?${params.toString()}`, getConfig());
      
      if (response.data.success) {
        // API response structure update
        const { videos, pagination: meta } = response.data.data;
        setContentList(videos || []);
        setPagination({
          currentPage: meta?.currentPage || 1,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.totalVideos || 0,
          itemsPerPage: meta?.pageSize || 10,
          hasNextPage: meta?.hasNextPage || false,
          hasPrevPage: meta?.hasPrevPage || false,
        });
      }
    } catch (error: any) {
      toast.error("Failed to fetch video content");
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
      key: "thumbnail",
      header: "Preview",
      cell: (item) => (
        <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-gray-200 bg-black group">
          {item.videoContent?.thumbnail ? (
            <img src={item.videoContent.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Icon icon="mdi:video-off-outline" className="text-gray-400 w-5 h-5" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon="mdi:play-circle" className="text-white w-6 h-6 drop-shadow-md" />
          </div>
        </div>
      ),
    },
    {
      key: "title",
      header: "Video Information",
      cell: (item) => (
        <div className="max-w-xs">
          <p className="text-sm font-bold text-gray-900 truncate">
            {item.videoContent?.title || "Untitled Video"}
          </p>
          <p className="text-xs text-gray-500 line-clamp-1">
            {item.videoContent?.description}
          </p>
        </div>
      ),
    },
    {
      key: "publishAt",
      header: "Publish Schedule",
      cell: (item) => {
        const { date, time } = formatPublishTime(item.date, item.unlocksAt);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-700">{date}</span>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <Icon icon="mdi:clock-outline" /> {time}
            </span>
          </div>
        );
      },
    },
    {
      key: "features",
      header: "Settings",
      cell: (item) => (
        <div className="flex gap-2">
           {item.videoContent?.hasListenOnlyMode && (
             <span title="Listen Only Available" className="p-1 bg-amber-50 text-amber-600 rounded">
               <Icon icon="mdi:headphones" className="w-4 h-4" />
             </span>
           )}
           {item.videoContent?.isAutoMute && (
             <span title="Auto Mute On" className="p-1 bg-gray-50 text-gray-600 rounded">
               <Icon icon="mdi:volume-off" className="w-4 h-4" />
             </span>
           )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (item) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {item.isActive ? 'Live' : 'Hidden'}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/video/${item._id}/edit`}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Icon icon="mdi:pencil-box-outline" className="w-5 h-5" />
          </Link>
          <a
            href={item.videoContent?.videoUrl}
            target="_blank"
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
          </a>
        </div>
      ),
    },
  ];

  const summaryCards = [
    { label: "Total Videos", value: pagination.totalItems, icon: "mdi:video-library", color: "indigo" },
    { label: "Total Likes", value: contentList.reduce((a, b) => a + (b.likesCount || 0), 0), icon: "mdi:heart", color: "red" },
    { label: "Comments", value: contentList.reduce((a, b) => a + (b.commentsCount || 0), 0), icon: "mdi:comment-text", color: "blue" },
    { label: "Live Now", value: contentList.filter(i => i.isActive).length, icon: "mdi:broadcast", color: "emerald" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage daily motivational videos.</p>
        </div>
        <Link href="/dashboard/video/add">
          <Button icon="mdi:video-plus" className="bg-indigo-600 hover:bg-indigo-700">
            Add Video
          </Button>
        </Link>
      </div>

      <SummaryCards data={summaryCards as any} />

      <div className="bg-white/80 backdrop-blur-xl border z-50 border-gray-100 shadow-sm rounded-2xl ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 p-3">
          <div className="lg:col-span-9 w-full">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by video title..."
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
          emptyTitle="No Videos Found"
          emptyDescription="You haven't uploaded any videos yet or your search matched nothing."
        />
      </div>
    </div>
  );
}