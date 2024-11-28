#!/bin/bash

./extingui.sh

find . -type d -not -path '*/\.*' -not -name 'logs' | while read -r dir; do
  # Skip empty directories
  if [ -z "$(find "$dir" -mindepth 1 -print -quit)" ]; then
    echo "Skipping empty directory: ${dir}"
    continue
  fi

  if [ ! -f "${dir}/🕯️.ts" ]; then
    echo "Creating 🕯️.ts in ${dir}"
    touch "${dir}/🕯️.ts"

    for file in "${dir}"/*.ts; do
      if [[ -f "${file}" && "${file}" != "${dir}/🕯️.ts" ]]; then
        # Check if the file contains any line not starting with // and is not empty
        if grep -q -v -E '^(//|\s*$)' "${file}"; then
          filename="$(basename -s ".ts" -- "${file}")"
          echo "export * from './${filename}';" >> "${dir}/🕯️.ts"
        else
          echo "Skipping ${file} as it only contains commented or empty lines."
        fi
      fi
    done

    for subdir in "${dir}"/*; do
      if [[ -d "${subdir}" && "$(basename -- "${subdir}")" != "logs" ]]; then
        subdir_name="$(basename -- "${subdir}")"
        echo "export * from './${subdir_name}/🕯️';" >> "${dir}/🕯️.ts"
      fi
    done

    # Delete 🕯️.ts if it is empty
    if [ ! -s "${dir}/🕯️.ts" ]; then
      echo "Deleting empty 🕯️.ts in ${dir}"
      rm "${dir}/🕯️.ts"
    fi
  fi

done
