package dk.iwt.agile.boundary;

import java.io.StringReader;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import javax.enterprise.context.ApplicationScoped;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonString;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import org.jboss.logging.Logger;

@ServerEndpoint(value = "/poker-socket/{username}/{isPlayer}", encoders = {JsonEncoder.class})
@ApplicationScoped
public class PokerWebSocket {

    private static final Logger LOG = Logger.getLogger(PokerWebSocket.class);

    private Map<String, Session> sessions = new ConcurrentHashMap<>();
    private Map<String, String> scores = new ConcurrentHashMap<>();
    private boolean isShowingResults = false;
    private Set<String> players = new HashSet<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("username") String username, @PathParam("isPlayer") Boolean isPlayer) {
        sessions.put(username, session);
        if (isPlayer) {
            scores.put(username, "");
            players.add(username);
        }
        broadcast();
    }

    @OnClose
    public void onClose(Session session, @PathParam("username") String username) {
        sessions.remove(username);
        scores.remove(username);
        players.remove(username);
        if (sessions.isEmpty()) {
            isShowingResults = false;
        }
        broadcast();
    }

    @OnError
    public void onError(Session session, @PathParam("username") String username, Throwable throwable) {
        sessions.remove(username);
        scores.remove(username);
        players.remove(username);
        LOG.error("onError", throwable);
        broadcast();
    }

    @OnMessage
    public void onMessage(String message, @PathParam("username") String username) {
        if (message.contains("score")) {
            JsonReader reader = Json.createReader(new StringReader(message));
            JsonObject object = (JsonObject) reader.read();
            JsonString score = (JsonString) object.get("score");
            scores.put(username, score.getString());
            broadcast();
        } else if (message.contains("showResults")) {
            this.isShowingResults = true;
            broadcast();
        } else if (message.contains("reset")) {
            this.isShowingResults = false;
            resetScores();
            broadcast();
        }
    }

    private void resetScores() {
        scores.clear();
        players.stream().forEach((player) -> scores.put(player, ""));
    }

    private void broadcast() {
        sessions.values().forEach(s -> {
            s.getAsyncRemote().sendObject(parseMessage(), result -> {
                if (result.getException() != null) {
                    System.out.println("Unable to send message: " + result.getException());
                }
            });
        });
    }

    private JsonObject parseMessage() {
        JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
        scores.forEach((user, score) -> {
            arrayBuilder.add(Json.createObjectBuilder().add("name", user).add("score", score));
        });

        JsonObjectBuilder outputBuilder = Json.createObjectBuilder();
        outputBuilder.add("showResults", this.isShowingResults);
        outputBuilder.add("scores", arrayBuilder);
        outputBuilder.add("allVotesAreIn", hasEveryoneVoted());

        return outputBuilder.build();
    }

    private boolean hasEveryoneVoted() {
        int hasScored = 0;
        hasScored = scores.values().stream()
                .filter((score) -> (score.length() > 0))
                .map((_item) -> 1)
                .reduce(hasScored, Integer::sum);
        return scores.size() > 0 && hasScored == scores.size();
    }
}
