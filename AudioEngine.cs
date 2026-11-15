using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text;

namespace WebVolumeControl
{
    [ComImport]
    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    internal class MMDeviceEnumeratorComObject { }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IMMDeviceEnumerator
    {
        [PreserveSig] int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr ppDevices);
        [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
        [PreserveSig] int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, out IntPtr ppDevice);
        [PreserveSig] int RegisterEndpointNotificationCallback(IntPtr pClient);
        [PreserveSig] int UnregisterEndpointNotificationCallback(IntPtr pClient);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IMMDevice
    {
        [PreserveSig] int Activate(ref Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
        [PreserveSig] int OpenPropertyStore(int stgmAccess, out IntPtr ppProperties);
        [PreserveSig] int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        [PreserveSig] int GetState(out int pdwState);
    }

    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IAudioEndpointVolume
    {
        [PreserveSig] int RegisterControlChangeNotify(IntPtr pNotify);
        [PreserveSig] int UnregisterControlChangeNotify(IntPtr pNotify);
        [PreserveSig] int GetChannelCount(out int pnChannelCount);
        [PreserveSig] int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
        [PreserveSig] int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        [PreserveSig] int GetMasterVolumeLevel(out float pfLevelDB);
        [PreserveSig] int GetMasterVolumeLevelScalar(out float pfLevel);
        [PreserveSig] int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
        [PreserveSig] int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
        [PreserveSig] int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
        [PreserveSig] int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
        [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
        [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
    }

    [Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IAudioSessionManager2
    {
        [PreserveSig] int GetAudioSessionControl(ref Guid AudioSessionGuid, uint StreamFlags, out IntPtr SessionControl);
        [PreserveSig] int GetSimpleAudioVolume(ref Guid AudioSessionGuid, uint StreamFlags, out IntPtr AudioVolume);
        [PreserveSig] int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
        [PreserveSig] int RegisterSessionNotification(IntPtr NewSessionNotification);
        [PreserveSig] int UnregisterSessionNotification(IntPtr NewSessionNotification);
        [PreserveSig] int RegisterDuckNotification(string sessionID, IntPtr duckNotification);
        [PreserveSig] int UnregisterDuckNotification(IntPtr duckNotification);
    }

    [Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IAudioSessionEnumerator
    {
        [PreserveSig] int GetCount(out int SessionCount);
        [PreserveSig] int GetSession(int SessionIndex, out IntPtr Session);
    }

    [Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IAudioSessionControl
    {
        [PreserveSig] int GetState(out int pRetVal);
        [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, ref Guid EventContext);
        [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, ref Guid EventContext);
        [PreserveSig] int GetGroupingParam(out Guid pRetVal);
        [PreserveSig] int SetGroupingParam(ref Guid Override, ref Guid EventContext);
        [PreserveSig] int RegisterAudioSessionNotification(IntPtr NewNotifications);
        [PreserveSig] int UnregisterAudioSessionNotification(IntPtr NewNotifications);
    }

    [Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface IAudioSessionControl2
    {
        [PreserveSig] int GetState(out int pRetVal);
        [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, ref Guid EventContext);
        [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, ref Guid EventContext);
        [PreserveSig] int GetGroupingParam(out Guid pRetVal);
        [PreserveSig] int SetGroupingParam(ref Guid Override, ref Guid EventContext);
        [PreserveSig] int RegisterAudioSessionNotification(IntPtr NewNotifications);
        [PreserveSig] int UnregisterAudioSessionNotification(IntPtr NewNotifications);
        [PreserveSig] int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        [PreserveSig] int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        [PreserveSig] int GetProcessId(out uint pRetVal);
        [PreserveSig] int IsSystemSoundsSession();
        [PreserveSig] int SetDuckingPreference([MarshalAs(UnmanagedType.Bool)] bool optOut);
    }

    [Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [ComImport]
    internal interface ISimpleAudioVolume
    {
        [PreserveSig] int SetMasterVolume(float fLevel, ref Guid EventContext);
        [PreserveSig] int GetMasterVolume(out float pfLevel);
        [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid EventContext);
        [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
    }

    public class Program
    {
        private static IMMDevice GetDefaultRenderDevice()
        {
            var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
            IMMDevice dev;
            int hr = enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (hr != 0 || dev == null) return null;
            return dev;
        }

        private static IMMDevice GetDefaultCaptureDevice()
        {
            try
            {
                var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
                IMMDevice dev;
                int hr = enumerator.GetDefaultAudioEndpoint(1, 1, out dev);
                if (hr != 0 || dev == null)
                {
                    hr = enumerator.GetDefaultAudioEndpoint(1, 2, out dev);
                }
                if (hr != 0 || dev == null) return null;
                return dev;
            }
            catch
            {
                return null;
            }
        }

        private static IAudioEndpointVolume GetMasterEndpointVolume(IMMDevice dev)
        {
            Guid iid = typeof(IAudioEndpointVolume).GUID;
            object o;
            int hr = dev.Activate(ref iid, 23, IntPtr.Zero, out o);
            if (hr != 0 || o == null) return null;
            return (IAudioEndpointVolume)o;
        }

        private static IAudioSessionManager2 GetAudioSessionManager(IMMDevice dev)
        {
            try
            {
                Guid iid = typeof(IAudioSessionManager2).GUID;
                object o;
                int hr = dev.Activate(ref iid, 23, IntPtr.Zero, out o);
                if (hr != 0 || o == null) return null;
                return (IAudioSessionManager2)o;
            }
            catch
            {
                return null;
            }
        }

        private static string EscapeJsonString(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            var sb = new StringBuilder();
            foreach (char c in s)
            {
                if (c == '\\') sb.Append("\\\\");
                else if (c == '"') sb.Append("\\\"");
                else if (c == '\b') sb.Append("\\b");
                else if (c == '\f') sb.Append("\\f");
                else if (c == '\n') sb.Append("\\n");
                else if (c == '\r') sb.Append("\\r");
                else if (c == '\t') sb.Append("\\t");
                else if (c < 32) sb.AppendFormat(CultureInfo.InvariantCulture, "\\u{0:x4}", (int)c);
                else sb.Append(c);
            }
            return sb.ToString();
        }

        [STAThread]
        public static void Main(string[] args)
        {
            try { Console.OutputEncoding = Encoding.UTF8; } catch { }

            string cmd = args.Length > 0 ? args[0].ToLowerInvariant() : "get";

            try
            {
                var dev = GetDefaultRenderDevice();
                if (dev == null)
                {
                    Console.WriteLine("{\"master\":{\"volume\":100,\"muted\":false},\"sessions\":[],\"error\":\"No audio device found\"}");
                    return;
                }

                var master = GetMasterEndpointVolume(dev);
                if (master == null)
                {
                    Console.WriteLine("{\"master\":{\"volume\":100,\"muted\":false},\"sessions\":[],\"error\":\"Cannot activate master endpoint\"}");
                    return;
                }

                Guid emptyGuid = Guid.Empty;

                if (cmd == "get")
                {
                    float masterVol = 1.0f;
                    bool masterMuted = false;
                    try
                    {
                        master.GetMasterVolumeLevelScalar(out masterVol);
                        master.GetMute(out masterMuted);
                    }
                    catch { }

                    int masterPct = (int)Math.Round(masterVol * 100);

                    var sessionsSb = new StringBuilder();
                    sessionsSb.Append("[");
                    bool isFirst = true;

                    try
                    {
                        var mgr = GetAudioSessionManager(dev);
                        if (mgr != null)
                        {
                            IAudioSessionEnumerator sessionEnum = null;
                            if (mgr.GetSessionEnumerator(out sessionEnum) == 0 && sessionEnum != null)
                            {
                                int sessionCount = 0;
                                sessionEnum.GetCount(out sessionCount);

                                for (int i = 0; i < sessionCount; i++)
                                {
                                    IntPtr pSession = IntPtr.Zero;
                                    try
                                    {
                                        if (sessionEnum.GetSession(i, out pSession) == 0 && pSession != IntPtr.Zero)
                                        {
                                            object obj = Marshal.GetObjectForIUnknown(pSession);
                                            var ctl2 = obj as IAudioSessionControl2;
                                            var sav = obj as ISimpleAudioVolume;
                                            var ctl = obj as IAudioSessionControl;

                                            uint pid = 0;
                                            if (ctl2 != null)
                                            {
                                                try { ctl2.GetProcessId(out pid); } catch { }
                                            }

                                            float appVol = 1.0f;
                                            bool appMuted = false;
                                            if (sav != null)
                                            {
                                                try
                                                {
                                                    sav.GetMasterVolume(out appVol);
                                                    sav.GetMute(out appMuted);
                                                }
                                                catch { }
                                            }

                                            string appName = "System Sounds";
                                            string dispName = "";
                                            if (ctl != null)
                                            {
                                                try { ctl.GetDisplayName(out dispName); } catch { }
                                            }

                                            if (pid > 0)
                                            {
                                                try
                                                {
                                                    var proc = Process.GetProcessById((int)pid);
                                                    appName = proc.ProcessName;
                                                    if (string.IsNullOrEmpty(dispName))
                                                    {
                                                        dispName = proc.MainWindowTitle;
                                                    }
                                                }
                                                catch { }
                                            }

                                            if (string.IsNullOrEmpty(dispName) || dispName.StartsWith("@"))
                                            {
                                                dispName = appName;
                                            }

                                            bool isSpotify = (appName != null && appName.IndexOf("spotify", StringComparison.OrdinalIgnoreCase) >= 0)
                                                || (dispName != null && dispName.IndexOf("spotify", StringComparison.OrdinalIgnoreCase) >= 0);

                                            int volPct = (int)Math.Round(appVol * 100.0f);
                                            if (isSpotify)
                                            {
                                                if (appVol <= 0.00001f)
                                                {
                                                    volPct = 0;
                                                }
                                                else if (appVol >= 0.9999f)
                                                {
                                                    volPct = 100;
                                                }
                                                else
                                                {
                                                    // Spotify desktop maps slider S (0..1) to amplitude A = S^3
                                                    // Inverting to get perceptual slider position: S = A^(1/3)
                                                    volPct = (int)Math.Round(Math.Pow((double)appVol, 1.0 / 3.0) * 100.0);
                                                    if (volPct > 100) volPct = 100;
                                                    if (volPct < 0) volPct = 0;
                                                }
                                            }

                                            if (!isFirst) sessionsSb.Append(",");
                                            isFirst = false;

                                            sessionsSb.Append(string.Format(CultureInfo.InvariantCulture,
                                                "{{\"pid\":{0},\"name\":\"{1}\",\"displayName\":\"{2}\",\"volume\":{3},\"rawVolume\":{4:F4},\"isSpotify\":{5},\"muted\":{6}}}",
                                                pid, EscapeJsonString(appName), EscapeJsonString(dispName), volPct, appVol, isSpotify ? "true" : "false", appMuted ? "true" : "false"));
                                        }
                                    }
                                    catch { }
                                    finally
                                    {
                                        if (pSession != IntPtr.Zero)
                                        {
                                            Marshal.Release(pSession);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch { }

                    sessionsSb.Append("]");

                    float micVol = 1.0f;
                    bool micMuted = false;
                    bool hasMic = false;
                    try
                    {
                        var capDev = GetDefaultCaptureDevice();
                        if (capDev != null)
                        {
                            var micMaster = GetMasterEndpointVolume(capDev);
                            if (micMaster != null)
                            {
                                micMaster.GetMasterVolumeLevelScalar(out micVol);
                                micMaster.GetMute(out micMuted);
                                hasMic = true;
                            }
                        }
                    }
                    catch { }
                    int micPct = (int)Math.Round(micVol * 100);

                    Console.WriteLine(string.Format(CultureInfo.InvariantCulture,
                        "{{\"master\":{{\"volume\":{0},\"muted\":{1}}},\"mic\":{{\"volume\":{3},\"muted\":{4},\"available\":{5}}},\"sessions\":{2}}}",
                        masterPct, masterMuted ? "true" : "false", sessionsSb.ToString(), micPct, micMuted ? "true" : "false", hasMic ? "true" : "false"));
                }
                else if (cmd == "get-mic")
                {
                    var capDev = GetDefaultCaptureDevice();
                    if (capDev != null)
                    {
                        var micMaster = GetMasterEndpointVolume(capDev);
                        if (micMaster != null)
                        {
                            float vol = 1.0f;
                            bool muted = false;
                            micMaster.GetMasterVolumeLevelScalar(out vol);
                            micMaster.GetMute(out muted);
                            Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"success\":true,\"volume\":{0},\"muted\":{1}}}", (int)Math.Round(vol * 100), muted ? "true" : "false"));
                            return;
                        }
                    }
                    Console.WriteLine("{\"success\":false,\"error\":\"No microphone found\"}");
                    return;
                }
                else if (cmd == "mute-mic")
                {
                    var capDev = GetDefaultCaptureDevice();
                    if (capDev != null)
                    {
                        var micMaster = GetMasterEndpointVolume(capDev);
                        if (micMaster != null)
                        {
                            bool hasExplicit = args.Length >= 2;
                            bool explicitMute = false;
                            if (hasExplicit)
                            {
                                string arg = args[1].ToLowerInvariant();
                                explicitMute = (arg == "true" || arg == "1");
                            }
                            bool cur = false;
                            micMaster.GetMute(out cur);
                            bool newMute = hasExplicit ? explicitMute : !cur;
                            micMaster.SetMute(newMute, ref emptyGuid);
                            Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"success\":true,\"muted\":{0}}}", newMute ? "true" : "false"));
                            return;
                        }
                    }
                    Console.WriteLine("{\"success\":false,\"error\":\"No microphone found\"}");
                    return;
                }
                else if (cmd == "set-master")
                {
                    if (args.Length < 2) return;
                    float vol = float.Parse(args[1], CultureInfo.InvariantCulture);
                    vol = Math.Max(0, Math.Min(100, vol));
                    master.SetMasterVolumeLevelScalar(vol / 100.0f, ref emptyGuid);
                    Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"success\":true,\"volume\":{0}}}", (int)Math.Round(vol)));
                }
                else if (cmd == "mute-master")
                {
                    bool curMute = false;
                    master.GetMute(out curMute);
                    bool target = !curMute;
                    if (args.Length >= 2)
                    {
                        string arg = args[1].ToLowerInvariant();
                        if (arg == "true" || arg == "1") target = true;
                        else if (arg == "false" || arg == "0") target = false;
                    }
                    master.SetMute(target, ref emptyGuid);
                    Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"success\":true,\"muted\":{0}}}", target ? "true" : "false"));
                }
                else if (cmd == "set-app")
                {
                    if (args.Length < 3) return;
                    uint targetPid = uint.Parse(args[1]);
                    float vol = float.Parse(args[2], CultureInfo.InvariantCulture);
                    vol = Math.Max(0, Math.Min(100, vol));
                    float scalar = vol / 100.0f;

                    bool forceCubic = args.Length >= 4 && args[3].Equals("cubic", StringComparison.OrdinalIgnoreCase);

                    var mgr = GetAudioSessionManager(dev);
                    if (mgr != null)
                    {
                        IAudioSessionEnumerator sessionEnum;
                        if (mgr.GetSessionEnumerator(out sessionEnum) == 0 && sessionEnum != null)
                        {
                            int count = 0;
                            sessionEnum.GetCount(out count);
                            for (int i = 0; i < count; i++)
                            {
                                IntPtr pSession = IntPtr.Zero;
                                try
                                {
                                    if (sessionEnum.GetSession(i, out pSession) == 0 && pSession != IntPtr.Zero)
                                    {
                                        object obj = Marshal.GetObjectForIUnknown(pSession);
                                        var ctl2 = obj as IAudioSessionControl2;
                                        var ctl = obj as IAudioSessionControl;
                                        uint pid = 0;
                                        if (ctl2 != null) ctl2.GetProcessId(out pid);
                                        if (pid == targetPid)
                                        {
                                            bool isSpotify = forceCubic;
                                            if (!isSpotify)
                                            {
                                                string pName = "";
                                                try
                                                {
                                                    var proc = Process.GetProcessById((int)pid);
                                                    pName = proc.ProcessName;
                                                }
                                                catch { }

                                                string dName = "";
                                                if (ctl != null)
                                                {
                                                    try { ctl.GetDisplayName(out dName); } catch { }
                                                }

                                                if ((pName != null && pName.IndexOf("spotify", StringComparison.OrdinalIgnoreCase) >= 0) ||
                                                    (dName != null && dName.IndexOf("spotify", StringComparison.OrdinalIgnoreCase) >= 0))
                                                {
                                                    isSpotify = true;
                                                }
                                            }

                                            float finalScalar = scalar;
                                            if (isSpotify)
                                            {
                                                // Spotify cubic audio taper: amplitude = (slider/100)^3
                                                float s = vol / 100.0f;
                                                finalScalar = s * s * s;
                                            }

                                            var sav = obj as ISimpleAudioVolume;
                                            if (sav != null)
                                            {
                                                sav.SetMasterVolume(finalScalar, ref emptyGuid);
                                            }
                                        }
                                    }
                                }
                                catch { }
                                finally
                                {
                                    if (pSession != IntPtr.Zero) Marshal.Release(pSession);
                                }
                            }
                        }
                    }
                    Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"success\":true,\"pid\":{0},\"volume\":{1}}}", targetPid, (int)Math.Round(vol)));
                }
                else if (cmd == "mute-app")
                {
                    if (args.Length < 2) return;
                    uint targetPid = uint.Parse(args[1]);
                    bool hasExplicit = args.Length >= 3;
                    bool explicitMute = false;
                    if (hasExplicit)
                    {
                        string arg = args[2].ToLowerInvariant();
                        explicitMute = (arg == "true" || arg == "1");
                    }

                    bool newMute = false;
                    var mgr = GetAudioSessionManager(dev);
                    if (mgr != null)
                    {
                        IAudioSessionEnumerator sessionEnum;
                        if (mgr.GetSessionEnumerator(out sessionEnum) == 0 && sessionEnum != null)
                        {
                            int count = 0;
                            sessionEnum.GetCount(out count);
                            for (int i = 0; i < count; i++)
                            {
                                IntPtr pSession = IntPtr.Zero;
                                try
                                {
                                    if (sessionEnum.GetSession(i, out pSession) == 0 && pSession != IntPtr.Zero)
                                    {
                                        object obj = Marshal.GetObjectForIUnknown(pSession);
                                        var ctl2 = obj as IAudioSessionControl2;
                                        uint pid = 0;
                                        if (ctl2 != null) ctl2.GetProcessId(out pid);
                                        if (pid == targetPid)
                                        {
                                            var sav = obj as ISimpleAudioVolume;
                                            if (sav != null)
                                            {
                                                bool cur = false;
                                                sav.GetMute(out cur);
                                                newMute = hasExplicit ? explicitMute : !cur;
                                                sav.SetMute(newMute, ref emptyGuid);
                                            }
                                        }
                                    }
                                }
                                catch { }
                                finally
                                {
                                    if (pSession != IntPtr.Zero) Marshal.Release(pSession);
                                }
                            }
                        }
                    }
                    Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"success\":true,\"pid\":{0},\"muted\":{1}}}", targetPid, newMute ? "true" : "false"));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"master\":{{\"volume\":100,\"muted\":false}},\"sessions\":[],\"error\":\"{0}\"}}", EscapeJsonString(ex.Message)));
            }
        }
    }
}
