export interface Tracefile {
    traceEvents: Trace_Event[]
    metadata:    Metadata
}

export interface Metadata {
    'chrome-bitness':         number
    'clock-domain':           string
    command_line:             string
    'cpu-brand':              string
    'cpu-family':             number
    'cpu-model':              number
    'cpu-stepping':           number
    'gpu-devid':              number
    'gpu-driver':             string
    'gpu-features':           GPU_Features
    'gpu-gl-renderer':        string
    'gpu-gl-vendor':          string
    'gpu-psver':              string
    'gpu-venid':              number
    'gpu-vsver':              string
    'highres-ticks':          number
    'network-type':           string
    'num-cpus':               number
    'os-arch':                string
    'os-name':                string
    'os-version':             string
    'physical-memory':        number
    'product-version':        string
    revision:                 string
    'trace-capture-datetime': string
    'trace-config':           string
    trace_processor_stats:    Trace_Processor_Stats
    'user-agent':             string
    'v8-version':             string
}

export interface GPU_Features {
    '2d_canvas':                         string
    canvas_oop_rasterization:            string
    direct_rendering_display_compositor: string
    gpu_compositing:                     string
    multiple_raster_threads:             string
    opengl:                              string
    rasterization:                       string
    raw_draw:                            string
    skia_graphite:                       string
    video_decode:                        string
    video_encode:                        string
    vulkan:                              string
    webgl:                               string
    webgl2:                              string
    webgpu:                              string
    webnn:                               string
}

export interface Trace_Processor_Stats {
    android_br_parse_errors:                                    number
    android_input_event_parse_errors:                           number
    android_log_format_invalid:                                 number
    android_log_num_failed:                                     number
    android_log_num_skipped:                                    number
    android_log_num_total:                                      number
    atom_timestamp_missing:                                     number
    atom_unknown:                                               number
    clock_sync_cache_miss:                                      number
    clock_sync_failure:                                         number
    compact_sched_has_parse_errors:                             number
    compact_sched_switch_skipped:                               number
    compact_sched_waking_skipped:                               number
    config_write_into_file_no_flush:                            number
    deobfuscate_location_parse_error:                           number
    empty_chrome_metadata:                                      number
    energy_breakdown_missing_values:                            number
    energy_descriptor_invalid:                                  number
    energy_uid_breakdown_missing_values:                        number
    entity_state_descriptor_invalid:                            number
    entity_state_residency_invalid:                             number
    entity_state_residency_lookup_failed:                       number
    etm_no_importer:                                            number
    filter_errors:                                              number
    filter_input_bytes:                                         number
    filter_input_packets:                                       number
    filter_output_bytes:                                        number
    filter_time_taken_ns:                                       number
    flow_duplicate_id:                                          number
    flow_end_without_start:                                     number
    flow_invalid_id:                                            number
    flow_no_enclosing_slice:                                    number
    flow_step_without_start:                                    number
    flow_without_direction:                                     number
    frame_timeline_event_parser_errors:                         number
    frame_timeline_unpaired_end_event:                          number
    ftrace_abi_errors_skipped_zero_data_length:                 number
    ftrace_bundle_tokenizer_errors:                             number
    ftrace_kprobe_hits_begin:                                   number
    ftrace_kprobe_hits_delta:                                   number
    ftrace_kprobe_hits_end:                                     number
    ftrace_kprobe_misses_begin:                                 number
    ftrace_kprobe_misses_delta:                                 number
    ftrace_kprobe_misses_end:                                   number
    ftrace_missing_event_id:                                    number
    ftrace_packet_before_tracing_start:                         number
    ftrace_setup_errors:                                        number
    ftrace_thermal_exynos_acpm_unknown_tz_id:                   number
    fuchsia_invalid_event:                                      number
    fuchsia_non_numeric_counters:                               number
    fuchsia_timestamp_overflow:                                 number
    game_intervention_has_parse_errors:                         number
    game_intervention_has_read_errors:                          number
    gpu_counters_invalid_spec:                                  number
    gpu_counters_missing_spec:                                  number
    gpu_render_stage_parser_errors:                             number
    graphics_frame_event_parser_errors:                         number
    guess_trace_type_duration_ns:                               number
    heap_graph_non_finalized_graph:                             number
    heapprofd_missing_packet:                                   number
    heapprofd_non_finalized_profile:                            number
    interned_data_tokenizer_errors:                             number
    invalid_clock_snapshots:                                    number
    invalid_cpu_times:                                          number
    jit_unknown_frame:                                          number
    json_display_time_unit:                                     number
    json_parser_failure:                                        number
    json_tokenizer_failure:                                     number
    legacy_v8_cpu_profile_invalid_callsite:                     number
    legacy_v8_cpu_profile_invalid_sample:                       number
    mali_unknown_mcu_state_id:                                  number
    meminfo_unknown_keys:                                       number
    memory_snapshot_parser_failure:                             number
    metatrace_overruns:                                         number
    mismatched_sched_switch_tids:                               number
    misplaced_end_event:                                        number
    mm_unknown_type:                                            number
    network_trace_intern_errors:                                number
    network_trace_parse_errors:                                 number
    ninja_parse_errors:                                         number
    packages_list_has_parse_errors:                             number
    packages_list_has_read_errors:                              number
    parse_trace_duration_ns:                                    number
    perf_aux_collision:                                         number
    perf_aux_ignored:                                           number
    perf_aux_lost:                                              number
    perf_aux_missing:                                           number
    perf_aux_partial:                                           number
    perf_aux_truncated:                                         number
    perf_auxtrace_missing:                                      number
    perf_counter_skipped_because_no_cpu:                        number
    perf_dummy_mapping_used:                                    number
    perf_no_tsc_data:                                           number
    perf_samples_cpu_mode_unknown:                              number
    perf_samples_skipped:                                       number
    perf_samples_skipped_dataloss:                              number
    pixel_modem_negative_timestamp:                             number
    power_rail_unknown_index:                                   number
    proc_stat_unknown_counters:                                 number
    process_tracker_errors:                                     number
    psi_unknown_resource:                                       number
    rss_stat_negative_size:                                     number
    rss_stat_unknown_keys:                                      number
    rss_stat_unknown_thread_for_mm_id:                          number
    sorter_push_event_out_of_order:                             number
    spe_no_timestamp:                                           number
    spe_record_dropped:                                         number
    stackprofile_empty_callstack:                               number
    stackprofile_invalid_callstack_id:                          number
    stackprofile_invalid_frame_id:                              number
    stackprofile_invalid_mapping_id:                            number
    stackprofile_invalid_string_id:                             number
    stackprofile_parser_error:                                  number
    symbolization_tmp_build_id_not_found:                       number
    systrace_parse_failure:                                     number
    task_state_invalid:                                         number
    thread_time_in_state_unknown_cpu_freq:                      number
    tokenizer_skipped_packets:                                  number
    traced_buf:                                                 { [key: string]: number }[]
    traced_chunks_discarded:                                    number
    traced_clone_started_timestamp_ns:                          number
    traced_data_sources_registered:                             number
    traced_data_sources_seen:                                   number
    traced_final_flush_failed:                                  number
    traced_final_flush_succeeded:                               number
    traced_flushes_failed:                                      number
    traced_flushes_requested:                                   number
    traced_flushes_succeeded:                                   number
    traced_patches_discarded:                                   number
    traced_producers_connected:                                 number
    traced_producers_seen:                                      number
    traced_total_buffers:                                       number
    traced_tracing_sessions:                                    number
    track_event_dropped_packets_outside_of_range_of_interest:   number
    track_event_parser_errors:                                  number
    track_event_thread_invalid_end:                             number
    track_event_tokenizer_errors:                               number
    truncated_sys_write_duration:                               number
    unknown_extension_fields:                                   number
    v8_code_load_missing_code_range:                            number
    v8_intern_errors:                                           number
    v8_isolate_has_no_code_range:                               number
    v8_no_code_range:                                           number
    v8_no_defaults:                                             number
    v8_unknown_code_type:                                       number
    vmstat_unknown_keys:                                        number
    vulkan_allocations_invalid_string_id:                       number
    winscope_inputmethod_clients_parse_errors:                  number
    winscope_inputmethod_manager_service_parse_errors:          number
    winscope_inputmethod_service_parse_errors:                  number
    winscope_protolog_invalid_interpolation_parse_errors:       number
    winscope_protolog_message_decoding_failed:                  number
    winscope_protolog_missing_interned_arg_parse_errors:        number
    winscope_protolog_missing_interned_stacktrace_parse_errors: number
    winscope_protolog_view_config_collision:                    number
    winscope_sf_layers_parse_errors:                            number
    winscope_sf_transactions_parse_errors:                      number
    winscope_shell_transitions_parse_errors:                    number
    winscope_viewcapture_missing_interned_string_parse_errors:  number
    winscope_viewcapture_parse_errors:                          number
    winscope_windowmanager_parse_errors:                        number
}

export interface Trace_Event {
    args:  Args
    cat:   Categories
    name:  Trace_Event_Name
    ph:    Bp
    pid:   number
    tid:   number
    ts:    number
    dur?:  number
    tdur?: number
    tts?:  number
    s?:    S
    id?:   number
    bp?:   Bp
    id2?:  Id2
}

export type Trace_Event_Name = 
    | 'AnimationFrame'
    | `AnimationFrame::${Trace_Event_Name_Animation_Frame}`
    | 'BeginCommitCompositorFrame'
    | 'Commit'
    | 'EventDispatch'
    | 'FunctionCall'
    | 'GPUTask'
    | 'HitTest'
    | 'Layerize'
    | 'MinorGC'
    | 'Parallel scavenge started'
    | 'PrePaint'
    | 'RunTask'
    | 'ScheduleStyleRecalculation'
    | 'SetLayerTreeId'
    | 'TimerFire'
    | 'TimerInstall'
    | 'TracingSessionIdForWorker'
    | 'TracingStartedInBrowser'
    | 'UpdateCounters'
    | 'UpdateLayoutTree'
    | `V8.${Trace_Event_Name_U8}`
    | 'process_name'
    | 'process_uptime_seconds'
    | 'thread_name'

export type Trace_Event_Name_Animation_Frame =
    | 'FirstUIEvent'
    | 'Render'
    | 'Script::Execute'
    | 'StyleAndLayout'

export type Trace_Event_Name_U8 =
    | 'GC_HEAP_EPILOGUE'
    | 'GC_HEAP_EPILOGUE_SAFEPOINT'
    | 'GC_HEAP_EXTERNAL_EPILOGUE'
    | 'GC_HEAP_EXTERNAL_PROLOGUE'
    | 'GC_HEAP_PROLOGUE'
    | 'GC_HEAP_PROLOGUE_SAFEPOINT'
    | 'GC_MC_COMPLETE_SWEEPING'
    | 'GC_SCAVENGER'
    | 'GC_SCAVENGER_BACKGROUND_SCAVENGE_PARALLEL'
    | 'GC_SCAVENGER_FREE_REMEMBERED_SET'
    | 'GC_SCAVENGER_SCAVENGE'
    | 'GC_SCAVENGER_SCAVENGE_FINALIZE'
    | 'GC_SCAVENGER_SCAVENGE_PARALLEL'
    | 'GC_SCAVENGER_SCAVENGE_PARALLEL_PHASE'
    | 'GC_SCAVENGER_SCAVENGE_ROOTS'
    | 'GC_SCAVENGER_SCAVENGE_UPDATE_REFS'
    | 'GC_SCAVENGER_SCAVENGE_WEAK_GLOBAL_HANDLES_IDENTIFY'
    | 'GC_SCAVENGER_SCAVENGE_WEAK_GLOBAL_HANDLES_PROCESS'


export interface Args {
    name?:                               string
    uptime?:                             string
    data?:                               Data
    type?:                               string
    usedHeapSizeAfter?:                  number
    usedHeapSizeBefore?:                 number
    epoch?:                              number
    UseBackgroundThreads?:               boolean
    beginData?:                          Begin_Data
    elementCount?:                       number
    frameSeqId?:                         number
    layerTreeId?:                        number
    frame?:                              Frame_Enum
    is_mobile_optimized?:                boolean
    endData?:                            End_Data
    animation_frame_timing_info?:        Animation_Frame_Timing_Info
    id?:                                 string
    animation_frame_script_timing_info?: Animation_Frame_Script_Timing_Info
}

export interface Animation_Frame_Script_Timing_Info {
    class_like_name:               string
    invoker_type:                  string
    layout_duration_ms:            number
    pause_duration_ms:             number
    property_like_name:            string
    source_location_char_position: number
    source_location_function_name: string
    source_location_url:           string
    style_duration_ms:             number
    third_party_technology:        string
}

export interface Animation_Frame_Timing_Info {
    begin_frame_id:       Begin_Frame_ID
    blocking_duration_ms: number
    duration_ms:          number
    num_scripts:          number
}

export interface Begin_Frame_ID {
    sequence_number: number
    source_id:       number
}

export interface Begin_Data {
    frame: Frame_Enum
}

export enum Frame_Enum {
    The96686Ee569Df8C2566938C41789Cea5E = '96686EE569DF8C2566938C41789CEA5E',
}

export interface Data {
    frame?:                Frame_Enum
    url?:                  string
    workerId?:             string
    workerThreadId?:       number
    frameTreeNodeId?:      number
    frames?:               Frame_Element[]
    persistentIds?:        boolean
    renderer_pid?:         number
    used_bytes?:           number
    singleShot?:           boolean
    timeout?:              number
    timerId?:              number
    documents?:            number
    jsEventListeners?:     number
    jsHeapSizeUsed?:       number
    nodes?:                number
    type?:                 string
    columnNumber?:         number
    functionName?:         string
    lineNumber?:           number
    scriptId?:             string
    layerTreeId?:          number
    isMainFrame?:          boolean
    isOutermostMainFrame?: boolean
    page?:                 Frame_Enum
}

export interface Frame_Element {
    frame:                Frame_Enum
    isInPrimaryMainFrame: boolean
    isOutermostMainFrame: boolean
    name:                 string
    processId:            number
    url:                  string
}

export interface End_Data {
    nodeId:      number
    nodeName:    string
    rectilinear: boolean
    x:           number
    y:           number
}

export type Bp = 'B' | 'b' | 'e' | 'f' | 'I' | 'M' | 'n' | 's' | 'X'

export type Category =
    | '__metadata'
    | 'blink'
    | 'v8'
    | 'devtools.timeline'
    | 'disabled-by-default-v8.gc'
    | 'disabled-by-default-devtools.timeline'

export type Categories = string

export interface Id2 {
    local: string
}

export type S = 't'

export function parse_trace_events_file(src: string): Tracefile {
    return JSON.parse(src)
}
