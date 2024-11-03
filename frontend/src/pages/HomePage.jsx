import React, { useEffect, useState } from "react"; // Import React here
import { Box, Flex, Spinner } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import Post from "../components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";

const HomePage = () => {
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [loading, setLoading] = useState(true);
	const showToast = useShowToast();

	useEffect(() => {
		const getFeedPosts = async () => {
			setLoading(true);
			setPosts([]);
			try {
				const res = await fetch("/api/posts/feed");
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}
				console.log(data);
				setPosts(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setLoading(false);
			}
		};
		getFeedPosts();
	}, [showToast, setPosts]);

	return (
		<Flex gap="10" alignItems="flex-start" direction={{ base: "column", md: "row" }} mt={-10} >
			<Box flex={70}>
				{!loading && posts.length === 0 && (
					<>
						<h1>Follow some users to see the feed</h1>
						{/* Show SuggestedUsers on mobile when there are no posts */}
						<Box display={{ base: "block", md: "none" }}>
							<SuggestedUsers />
						</Box>
					</>
				)}
				{loading && (
					<Flex justify="center">
						<Spinner size="xl" />
					</Flex>
				)}

				{/* Map through posts and render each post */}
				{posts.map((post, index) => (
					<React.Fragment key={post._id}>
						<Post post={post} postedBy={post.postedBy} />

						{/* Render SuggestedUsers after the 2nd post */}
						{index === 0 && (
							<Box display={{ base: "block", md: "none" }}>
								<SuggestedUsers />
							</Box>
						)}

						{/* Add margin-bottom of 20px if this is the last post */}
						{index === posts.length - 1 && (
							<Box mb="100px" />
						)}
					</React.Fragment>
				))}

			</Box>
			{/* Always show SuggestedUsers on larger screens */}
			<Box flex={300} display={{ base: "none", md: "block" }}>
				<SuggestedUsers />
			</Box>
		</Flex>
	);
};

export default HomePage;
