import sys

def main():
    file_path = "src/pages/pim/SpecsDemoPage.tsx"
    with open(file_path, "r") as f:
        lines = f.readlines()

    # We want to remove lines from:
    # 1. "        {/* Section 1: Tên sản phẩm */}" to just before "          {/* Section 6: Thông số kỹ thuật */}"
    # 2. "          {/* Section 7: Đặc điểm nổi bật (Highlights) */}" to just before "{selectedJob && (" which is after the right column
    
    out_lines = []
    skip = False
    for i, line in enumerate(lines):
        if "export function ProductDetailPage()" in line:
            out_lines.append(line.replace("ProductDetailPage", "SpecsDemoPage"))
            continue
        if "lg:col-span-8" in line:
            out_lines.append(line.replace("lg:col-span-8", "w-full"))
            continue
            
        if "{/* Section 1: Tên sản phẩm */}" in line:
            skip = True
        if "{/* Section 6: Thông số kỹ thuật */}" in line:
            skip = False
        
        if "{/* Section 7: Đặc điểm nổi bật (Highlights) */}" in line:
            skip = True
        
        # We need to stop skipping after the right column ends.
        # Right column ends at `      </div>` before `{selectedJob && (`
        if skip and "{selectedJob && (" in line:
            skip = False
            # We need to add the closing div for the grid that we skipped
            out_lines.append("        </div>\n")
            out_lines.append("      </div>\n")
            
        if not skip:
            out_lines.append(line)

    with open(file_path, "w") as f:
        f.writelines(out_lines)

if __name__ == "__main__":
    main()
