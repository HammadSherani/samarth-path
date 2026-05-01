"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import Button from "@/components/ui/Button";

export default function AddVideoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        hasListenOnlyMode: true,
    });

    const [files, setFiles] = useState<{ video: File | null; thumbnail: File | null }>({
        video: null,
        thumbnail: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: fileList } = e.target;
        if (fileList && fileList[0]) {
            const file = fileList[0];
            
            // 1. Size Validation (10MB)
            const fileSizeInMB = file.size / (1024 * 1024);
            if (fileSizeInMB > 10) {
                toast.error(`File "${file.name}" is too large! Max 10MB.`);
                e.target.value = "";
                return;
            }

            // 2. Duration Validation (7 minutes = 420 seconds) - Only for video
            if (name === "video") {
                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    if (video.duration > 420) {
                        toast.error("Video duration exceeds 7 minutes!");
                        e.target.value = "";
                        return;
                    }
                    setFiles((prev) => ({ ...prev, [name]: file }));
                };
                video.src = URL.createObjectURL(file);
            } else {
                setFiles((prev) => ({ ...prev, [name]: file }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!files.video || !files.thumbnail) {
            return toast.error("Please select both a video and a thumbnail.");
        }

        setLoading(true);
        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("date", formData.scheduledDate);
        data.append("hasListenOnlyMode", String(formData.hasListenOnlyMode));
        if (files.video) data.append("video", files.video);
        if (files.thumbnail) data.append("image", files.thumbnail);

        try {
            await axiosInstance.post("/daily-content/video", data, {
                ...getConfig(),
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Video Content Scheduled Successfully!");
            router.push("/dashboard/video");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to upload video");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = "w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
                        <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Video Content</h1>
                        <p className="text-sm text-gray-500">Max 10MB | Max 7 Minutes</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                                <input required type="text" name="title" value={formData.title} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Publish Date</label>
                                <input required type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} className={inputStyle} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video File (Max 10MB / 7min)</label>
                                <input required type="file" name="video" accept="video/*" onChange={handleFileChange} className="w-full h-11 p-1 border border-gray-200 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail</label>
                                <input required type="file" name="thumbnail" accept="image/*" onChange={handleFileChange} className="w-full h-11 p-1 border border-gray-200 rounded-xl" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                            <textarea required name="description" rows={5} value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none resize-none" />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="hasListenOnlyMode" checked={formData.hasListenOnlyMode} onChange={handleChange} className="w-4 h-4 accent-primary-600" />
                            <span className="text-sm font-semibold text-gray-700">Enable Listen Only Mode</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>Cancel</Button>
                        <Button type="submit" loading={loading} icon="mdi:cloud-upload">
                            {loading ? "Uploading..." : "Upload Video"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}