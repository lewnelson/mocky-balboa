<script setup lang="ts">
let data: { message: string };
try {
    const response = await useFetch<{ message: string }>(
        "https://mickeylovesyou.com/training-regime",
    );

    const message = response.data.value?.message;
    if (!message) {
        throw new Error("No message available");
    }

    data = { message };
} catch (error) {
    console.error(error);
}
</script>

<template>
    <div v-if="data == undefined">
        <p>No data available</p>
    </div>
    <div v-else>
        <p>{{ data.message }}</p>
    </div>
</template>
