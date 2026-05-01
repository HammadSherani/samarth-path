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
import Button from "@/components/ui/Button";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface QuizOption {
  id: string;
  text: string;
  _id: string;
}

interface QuizItem {
  _id: string;
  contentType: string;
  quizContent: {
    title: string;
    question: string;
    options: QuizOption[];
    correctOptionId: string;
    timerSeconds: number;
    explanation: string;
  };
  unlocksAt: string;
  date: string;
  isActive: boolean;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  createdAt: string;
}

export default function QuizManagementPage() {
  const [quizList, setQuizList] = useState<QuizItem[]>([]);
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

  // ─── Helper: Format Time ──────────────────────────────────────────────────
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
  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", queryState.page.toString());
      params.append("limit", queryState.limit.toString());
      if (queryState.search) params.append("search", queryState.search);
      if (queryState.status) params.append("status", queryState.status);

      const response = await axiosInstance.get(`/daily-content/quiz?${params.toString()}`, getConfig());

      if (response.data.success) {
        // Mapping based on your specific JSON response structure
        const { quizzes, totalPages, currentPage, totalQuizzes } = response.data.data;

        setQuizList(quizzes || []);
        setPagination({
          currentPage: parseInt(currentPage) || 1,
          totalPages: totalPages || 1,
          totalItems: totalQuizzes || 0,
          itemsPerPage: queryState.limit,
          hasNextPage: parseInt(currentPage) < totalPages,
          hasPrevPage: parseInt(currentPage) > 1,
        });
      }
    } catch (error: any) {
      toast.error("Failed to fetch quizzes");
      setQuizList([]);
    } finally {
      setLoading(false);
    }
  }, [queryState]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // ─── Table Columns ────────────────────────────────────────────────────────
  const columns: Column<QuizItem>[] = [
    {
      key: "quizInfo",
      header: "Quiz Details",
      cell: (item) => (
        <div className="max-w-xs">
          <p className="text-sm font-bold text-gray-900 truncate">
            {item.quizContent?.title || "No Title"}
          </p>
          <p className="text-xs text-gray-500 line-clamp-1">
            {item.quizContent?.question}
          </p>
        </div>
      ),
    },
    // {
    //   key: "timer",
    //   header: "Timer",
    //   cell: (item) => (
    //     <div className="flex items-center gap-1.5 text-gray-600">
    //       <Icon icon="mdi:timer-outline" className="w-4 h-4 text-orange-500" />
    //       <span className="text-sm font-medium">{item.quizContent?.timerSeconds}s</span>
    //     </div>
    //   ),
    // },
    {
      key: "publishAt",
      header: "Publish Schedule",
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
      key: "options",
      header: "Options",
      cell: (item) => (
        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">
          {item.quizContent?.options?.length || 0} CHOICES
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (item) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {/* Edit Link */}
          <Link
            href={`/dashboard/quiz/${item._id}/edit`}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Quiz"
          >
            <Icon icon="mdi:pencil-box-outline" className="w-5 h-5" />
          </Link>

          {/* NEW: Analytics/Results Link */}
          <Link
            href={`/dashboard/quiz/results/${item._id}`}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="View Results"
          >
            <Icon icon="mdi:chart-box-outline" className="w-5 h-5" />
          </Link>
        </div>
      ),
    },
  ];

  const summaryCards = [
    { label: "Total Quizzes", value: pagination.totalItems, icon: "mdi:help-circle", color: "blue" },
    { label: "Total Likes", value: quizList.reduce((a, b) => a + (b.likesCount || 0), 0), icon: "mdi:heart", color: "red" },
    { label: "Active Quizzes", value: quizList.filter(i => i.isActive).length, icon: "mdi:check-circle", color: "emerald" },
    { label: "Bookmarked", value: quizList.reduce((a, b) => a + (b.bookmarksCount || 0), 0), icon: "mdi:bookmark", color: "amber" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage daily interactive quizzes and questions.</p>
        </div>
        <Link href="/dashboard/quiz/add">
          <Button icon="mdi:plus" className="bg-primary-600 hover:bg-primary-700">
            Add Quiz
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
              placeholder="Search by quiz title or question..."
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
          data={quizList}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setQueryState((p) => ({ ...p, page }))}
          emptyTitle="No Quizzes Found"
          emptyDescription="Start by creating your first daily quiz."
        />
      </div>
    </div>
  );
}