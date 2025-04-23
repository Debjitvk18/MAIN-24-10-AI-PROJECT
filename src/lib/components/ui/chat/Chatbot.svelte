<script lang="ts">
	import { onMount } from 'svelte';
	import { socialMediaJson } from '$lib/stores/mapStore';
	import TypingIndicator from '../loader/TypingIndicator.svelte';
	import { MapService } from '$lib/services/map-service';
	import { getDataFromURL } from '$lib/utils/generalUtils';
	
	// Chat messages state
	interface ChatMessage {
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}
	
	let messages: ChatMessage[] = [];
	let inputMessage = '';
	let chatContainer: HTMLElement;
	let isProcessing = false;
	let isFirstMessage = true;
	let apiResponse = null;
	
	// Initialize MapService
	const mapService = new MapService();
	
	function sendMessage() {
		if (!inputMessage.trim() || isProcessing) return;
		
		// Add user message
		const userMessage: ChatMessage = {
			role: 'user',
			content: inputMessage,
			timestamp: new Date()
		};
		
		messages = [...messages, userMessage];
		const userQuery = inputMessage;
		inputMessage = '';
		isProcessing = true;
		
		// Scroll to bottom
		setTimeout(scrollToBottom, 50);
		
		if (isFirstMessage) {
			// Get latitude and longitude from URL or default values
			const lat = getDataFromURL('lat') || '40.6970243';
			const lng = getDataFromURL('long') || '-74.1443116';
			
			// Prepare payload for API
			const payload = {
				message: userQuery,
				latitude: lat,
				longitude: lng
			};
			
			// Make API call to /insights/initiate
			mapService.getInsights(payload)
				.then(response => {
					// Store the API response but don't remove the typing indicator
					apiResponse = response;
					console.log('API response:', response);
					
					// Set isFirstMessage to false to avoid making the API call again
					isFirstMessage = false;
					
					// Note: We're intentionally not setting isProcessing to false
					// to keep the typing indicator visible as requested
					
					// We're also not adding a response message yet, as requested
				})
				.catch(error => {
					console.error('API call failed:', error);
					// Keep the typing indicator even in case of error, as requested
				});
		} else {
			setTimeout(() => {
				isProcessing = false;
				setTimeout(scrollToBottom, 50);
			}, 1000);
		}
	}
	
	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="chatbot-wrapper h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
	<div class="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
		<h2 class="text-lg font-bold">Assistant</h2>
	</div>
	
	<div 
		class="flex-grow overflow-y-auto p-4"
		bind:this={chatContainer}
	>
		{#each messages as message}
			<div class="mb-4 flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div 
					class="max-w-[80%] p-3 rounded-lg {
						message.role === 'user' 
							? 'bg-blue-500 text-white rounded-tr-none' 
							: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none'
					}"
				>
					<p>{message.content}</p>
					<div class="text-xs mt-1 text-right opacity-70">
						{message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
					</div>
				</div>
			</div>
		{/each}
		
		{#if isProcessing}
			<TypingIndicator />
		{/if}
	</div>
	
	<div class="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
		<div class="flex items-end gap-2">
			<div class="flex-grow relative">
				<textarea
					rows="1"
					class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
					placeholder="Ask something..."
					bind:value={inputMessage}
					on:keydown={handleKeydown}
				></textarea>
			</div>
			<button 
				class="bg-blue-500 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center disabled:opacity-50"
				on:click={sendMessage}
				disabled={!inputMessage.trim() || isProcessing}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
					<path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
				</svg>
			</button>
		</div>
	</div>
</div>

