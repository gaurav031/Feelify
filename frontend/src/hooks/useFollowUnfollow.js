import { useState } from "react";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import { useRecoilValue } from "recoil";

const useFollowUnfollow = (user) => {
    const currentUser = useRecoilValue(userAtom);
    const [following, setFollowing] = useState(
        Array.isArray(user?.followers) && user.followers.includes(currentUser?._id)
    );
    const [updating, setUpdating] = useState(false);
    const showToast = useShowToast();

    if (!user || !user._id) {
        console.error("Invalid user object provided to useFollowUnfollow hook.");
        return { handleFollowUnfollow: () => {}, updating: false, following: false };
    }

    const handleFollowUnfollow = async () => {
        if (!currentUser || !currentUser._id) {
            showToast("Error", "Please log in to follow or unfollow users.", "error");
            return;
        }

        if (updating) return;

        setUpdating(true);
        const isFollowing = following;

        try {
            const res = await fetch(`/api/users/follow/${user._id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow" }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                showToast("Error", errorData?.message || "Failed to update follow status.", "error");
                return;
            }

            const data = await res.json();

            if (data.success) {
                setFollowing(!isFollowing);
                showToast("Success", `${isFollowing ? "Unfollowed" : "Followed"} ${user.name}`, "success");
            } else {
                showToast("Error", data.message || "An error occurred.", "error");
            }
        } catch (error) {
            console.error("Error in handleFollowUnfollow:", error);
            showToast("Error", "Something went wrong. Please try again.", "error");
        } finally {
            setUpdating(false);
        }
    };

    return { handleFollowUnfollow, updating, following };
};

export default useFollowUnfollow;
