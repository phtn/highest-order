const std = @import("std");

fn trimTrailingSemicolons(s: []const u8) []const u8 {
    var end_index = s.len;
    while (end_index > 0 and s[end_index - 1] == ';') {
        end_index -= 1;
    }
    return s[0..end_index];
}

pub fn ts_to_pg(allocator: std.mem.Allocator, typescript: []const u8) ![]const u8 {
    var output = std.ArrayList(u8).init(allocator);
    defer output.deinit();

    var lines = std.mem.splitAny(u8, typescript, "\n");
    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, &std.ascii.whitespace);
        if (std.mem.startsWith(u8, trimmed, "interface") or std.mem.startsWith(u8, trimmed, "type")) {
            try output.appendSlice("CREATE TABLE ");
            var words = std.mem.splitAny(u8, trimmed, " ");
            _ = words.next(); // Skip "interface" or "type"
            if (words.next()) |name| {
                try output.appendSlice(name);
                try output.appendSlice(" (\n");
            }
        } else if (std.mem.indexOf(u8, trimmed, ":") != null) {
            var parts = std.mem.splitAny(u8, trimmed, ":");
            if (parts.next()) |field_name| {
                try output.appendSlice("  ");
                try output.appendSlice(std.mem.trim(u8, field_name, &std.ascii.whitespace));
                try output.appendSlice(" ");
            }
            if (parts.next()) |field_type| {
                const sanitized_type = trimTrailingSemicolons(std.mem.trim(u8, field_type, &std.ascii.whitespace));
                const postgres_type = try typeScriptToPostgresType(allocator, sanitized_type);
                defer allocator.free(postgres_type);
                try output.appendSlice(postgres_type);
                try output.appendSlice(",\n");
            }
        } else if (std.mem.eql(u8, trimmed, "}")) {
            _ = output.pop(); // Remove last comma
            _ = output.pop(); // Remove last newline
            try output.appendSlice("\n);\n\n");
        }
    }

    return output.toOwnedSlice();
}

fn typeScriptToPostgresType(allocator: std.mem.Allocator, ts_type: []const u8) ![]const u8 {
    const TypeMap = struct {
        ts: []const u8,
        pg: []const u8,
    };

    const type_map = [_]TypeMap{
        .{ .ts = "string", .pg = "TEXT" },
        .{ .ts = "number", .pg = "NUMERIC" },
        .{ .ts = "boolean", .pg = "BOOLEAN" },
        .{ .ts = "Date", .pg = "TIMESTAMP" },
        .{ .ts = "bigint", .pg = "BIGINT" },
        .{ .ts = "int", .pg = "INTEGER" },
        .{ .ts = "float", .pg = "REAL" },
        .{ .ts = "double", .pg = "DOUBLE PRECISION" },
    };

    for (type_map) |map| {
        if (std.mem.eql(u8, ts_type, map.ts)) {
            return try allocator.dupe(u8, map.pg);
        }
    }

    // Handle arrays
    if (std.mem.startsWith(u8, ts_type, "Array<") or std.mem.endsWith(u8, ts_type, "[]")) {
        var inner_type = ts_type;
        if (std.mem.startsWith(u8, ts_type, "Array<")) {
            inner_type = inner_type[6 .. inner_type.len - 1];
        } else {
            inner_type = inner_type[0 .. inner_type.len - 2];
        }
        const pg_inner_type = try typeScriptToPostgresType(allocator, inner_type);
        defer allocator.free(pg_inner_type);
        return try std.fmt.allocPrint(allocator, "{s}[]", .{pg_inner_type});
    }

    // If no match found, return TEXT as a fallback
    return try std.fmt.allocPrint(allocator, "TEXT (unknown type: {s})", .{ts_type});
}

// export fn ts_2_pg(input: [*:0]const u8) [*:0]u8 {
//     const result = ts_to_pg(std.heap.c_allocator, std.mem.span(input)) catch unreachable;
//     const cstr = std.heap.c_allocator.dupeZ(u8, result) catch unreachable;
//     std.heap.c_allocator.free(result);
//     return cstr;
// }
//
export fn convert(input: [*:0]const u8) [*:0]u8 {
    const result = ts_to_pg(std.heap.c_allocator, std.mem.span(input)) catch |err| {
        std.debug.print("Error: {}\n", .{err});
        return std.heap.c_allocator.dupeZ(u8, "Error occurred") catch unreachable;
    };
    const cstr = std.heap.c_allocator.dupeZ(u8, result) catch unreachable;
    std.heap.c_allocator.free(result);
    return cstr;
}
