#!/bin/bash

# Kill any existing containers
echo "💣 Killing old containers..."
docker rm -f $(docker ps -a -q --filter name=vllm-node) 2>/dev/null || true

# Define Model
MODEL="intfloat/e5-mistral-7b-instruct"

# Loop to launch 8 nodes
for i in {0..7}
do
   # External Port (Host)
   HOST_PORT=$((8000 + i))
   
   # Internal Port (Container) - We keep this fixed at 8000 inside every container
   CONTAINER_PORT=8000
   
   GPU_ID=$i
   
   echo "🚀 Launching vLLM Node $i on GPU $GPU_ID (Host Port $HOST_PORT -> Container 8000)..."
   
   docker run -d \
       --name vllm-node-$i \
       --device /dev/kfd \
       --device /dev/dri \
       --shm-size 32g \
       -p $HOST_PORT:$CONTAINER_PORT \
       -e HSA_OVERRIDE_GFX_VERSION=9.4.2 \
       -e HIP_VISIBLE_DEVICES=$GPU_ID \
       -e CUDA_VISIBLE_DEVICES=$GPU_ID \
       rocm/vllm:latest \
       python3 -m vllm.entrypoints.openai.api_server \
       --model $MODEL \
       --task embed \
       --gpu-memory-utilization 0.9 \
       --max-model-len 8192 \
       --trust-remote-code \
       --dtype half \
       --port $CONTAINER_PORT
done

echo "✅ Cluster Launch Initiated. Wait 60s for all nodes to come online."