#!/bin/bash

# Default N to 100 if not provided
N=${1:-100}

# Starting address
start_hex="000000000000000000000000000000000000"

# Convert hex to decimal
start_dec=$((16#$start_hex))

# Calculate the ending hex value
end_hex=$(printf "0x%040x" $((start_dec + N - 1)))

# Print the initialization message
echo "Creating $N hex directories from 0x$start_hex to $end_hex"

# Loop to create directories
for ((i=0; i<N; i++)); do
  # Convert decimal to hex and ensure 40-character padding
  hex_dir=$(printf "0x%040x" $((start_dec + i)))
  
  # Create directory
  mkdir -p "$hex_dir"
  
  echo "Created directory: $hex_dir"
done

echo "Finished creating $N directories."
