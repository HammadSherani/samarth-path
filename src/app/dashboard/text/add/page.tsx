"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import Button from "@/components/ui/Button";

export default function AddTextPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        label: "",
        image: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        unlocksAt: "08:00",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axiosInstance.post(
                "/daily-content/text",
                formData,
                getConfig()
            );

            if (response.data.success) {
                toast.success("Text Content Scheduled Successfully!");
                router.push("/dashboard/content/text");
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to schedule content";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Top Navigation */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Text Content</h1>
                        <p className="text-sm text-gray-500">Enter your update and label details below.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                            <input
                                required
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter title (e.g., Daily Morning Update)"
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>

                        {/* Label & Publish Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Label</label>
                                <input
                                    required
                                    type="text"
                                    name="label"
                                    value={formData.label}
                                    onChange={handleChange}
                                    placeholder="e.g., Latest, Urgent, Special"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Publish Date</label>
                                <input
                                    required
                                    type="date"
                                    name="scheduledDate"
                                    // This disables all dates before today
                                    min={new Date().toISOString().split("T")[0]}
                                    value={formData.scheduledDate}
                                    onChange={handleChange}
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Time & Image */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unlock Time (24h Format)</label>
                                <input
                                    required
                                    type="time"
                                    name="unlocksAt"
                                    value={formData.unlocksAt}
                                    onChange={handleChange}
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL</label>
                                <input
                                    required
                                    type="url"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                            <textarea
                                required
                                name="description"
                                rows={5}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Write the content details here..."
                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            icon="mdi:send-clock"
                        >
                            Schedule Post
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}